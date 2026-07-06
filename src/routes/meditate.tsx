import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Wind, Play, Pause, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Mascot } from "@/components/mascot";
import { useAudioTracks, TrackChips, type AudioTrack } from "@/components/audio-picker";
import { celebrate } from "@/lib/celebrate";

export const Route = createFileRoute("/meditate")({
  head: () => ({ meta: [{ title: "Meditate — Guiding Mentor" }] }),
  component: () => <Protected><Meditate /></Protected>,
});

const PRESETS = [1, 2, 5, 10, 15];

function Meditate() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: meds } = useQuery({
    queryKey: ["meditations"],
    queryFn: async () => (await supabase.from("meditations").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: todayMood } = useQuery({
    queryKey: ["mood-today", uid],
    queryFn: async () => (await supabase.from("mood_logs").select("score").eq("user_id", uid!).eq("log_date", format(new Date(), "yyyy-MM-dd")).maybeSingle()).data,
    enabled: !!uid,
  });
  const relaxTracks = useAudioTracks("relax");
  const { data: profile } = useQuery({
    queryKey: ["profile-relax", uid],
    queryFn: async () => (await supabase.from("profiles").select("preferred_relax_track_id").eq("id", uid!).maybeSingle()).data,
    enabled: !!uid,
  });

  const recommended = (() => {
    if (!meds?.length) return null;
    if (todayMood?.score && todayMood.score <= 2) return meds.find((m) => m.category?.toLowerCase().includes("anxiety")) ?? meds[0];
    return meds.find((m) => m.category?.toLowerCase().includes("focus")) ?? meds[0];
  })();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [duration, setDuration] = useState(5);
  const [custom, setCustom] = useState("");
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [bgTrack, setBgTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(0.5);
  const tickRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { setRemaining(duration * 60); setRunning(false); setDone(false); }, [duration]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  // Preload preferred relaxation track
  useEffect(() => {
    if (profile && relaxTracks.data && !bgTrack) {
      const t = relaxTracks.data.find((x) => x.id === profile.preferred_relax_track_id);
      if (t) setBgTrack(t);
    }
  }, [profile, relaxTracks.data]); // eslint-disable-line

  useEffect(() => {
    if (!running) { audioRef.current?.pause(); return; }
    if (bgTrack && audioRef.current) {
      if (audioRef.current.src !== bgTrack.url) audioRef.current.src = bgTrack.url;
      audioRef.current.play().catch(() => {});
    }
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(tickRef.current!);
          setRunning(false);
          setDone(true);
          audioRef.current?.pause();
          celebrate("Session complete. Notice how you feel now. 🌿");
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const total = duration * 60;
  const pct = ((total - remaining) / total) * 100;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Mascot mood="neutral" size={64} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">A moment for you</h1>
          <p className="text-muted-foreground text-sm">Pick a length, choose a track, and let yourself land.</p>
        </div>
      </div>

      {/* Session player */}
      <Card><CardContent className="p-6 space-y-5">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="text-sm font-medium mr-2">Length:</div>
          {PRESETS.map((p) => (
            <Button key={p} size="sm" variant={duration === p ? "default" : "outline"} onClick={() => setDuration(p)}>{p} min</Button>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(custom); if (n > 0 && n <= 60) setDuration(n); }}>
            <Input type="number" placeholder="Custom" className="w-20" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <Button size="sm" variant="outline" type="submit">Set</Button>
          </form>
        </div>

        {selectedType && (
          <div className="text-sm text-muted-foreground">
            Type: <span className="text-foreground font-medium">{selectedType}</span>
          </div>
        )}

        <div className="relative mx-auto max-w-sm">
          <div className={`aspect-square rounded-full grid place-items-center gradient-calm text-primary-foreground ${done ? "ring-4 ring-primary/40" : ""}`}>
            <div className="text-center">
              <div className="uppercase tracking-widest text-xs opacity-80">{done ? "Complete" : running ? "Breathe" : "Ready"}</div>
              <div className="font-display text-6xl md:text-7xl font-semibold tabular-nums">{mm}:{ss}</div>
              <div className="text-sm opacity-80 mt-2">{duration} min session</div>
            </div>
          </div>
          <div className="h-1.5 mt-4 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          <Button size="lg" onClick={() => { setDone(false); setRunning((r) => !r); }} className="gap-2">
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setRunning(false); setRemaining(duration * 60); setDone(false); }} className="gap-2">
            <RotateCcw className="size-4" /> Reset
          </Button>
        </div>

        <div className="rounded-xl border p-4 space-y-3 bg-secondary/30">
          <div className="text-sm font-medium">Background music (optional)</div>
          <TrackChips
            tracks={relaxTracks.data ?? []}
            selectedId={bgTrack?.id ?? null}
            onSelect={(t) => { setBgTrack(t); if (running && audioRef.current) { audioRef.current.src = t.url; audioRef.current.play().catch(() => {}); } }}
            onStop={() => { setBgTrack(null); audioRef.current?.pause(); }}
          />
          <div>
            <div className="text-xs text-muted-foreground mb-1">Volume</div>
            <Slider value={[Math.round(volume * 100)]} min={0} max={100} step={5} onValueChange={(v) => setVolume((v[0] ?? 0) / 100)} />
          </div>
        </div>
      </CardContent></Card>

      {/* Meditation library / types */}
      {recommended && (
        <Card className="border-primary/40"><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2"><Wind className="size-4 text-primary" /><span className="text-xs uppercase tracking-wider text-primary font-medium">Recommended today</span></div>
          <div className="font-medium">{recommended.title}</div>
          <div className="text-sm text-muted-foreground">{recommended.category} · {recommended.duration_min} min</div>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => { setSelectedType(recommended.category ?? recommended.title); if (recommended.duration_min) setDuration(recommended.duration_min); }}>Start this session</Button>
            {recommended.audio_url && <audio className="ml-2" controls src={recommended.audio_url} />}
          </div>
        </CardContent></Card>
      )}

      <div>
        <div className="text-sm font-medium mb-2">Choose a type</div>
        <div className="grid md:grid-cols-2 gap-3">
          {meds?.map((m) => (
            <Card key={m.id}><CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="text-xs text-muted-foreground">{m.category} · {m.duration_min} min</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => { setSelectedType(m.category ?? m.title); if (m.duration_min) setDuration(m.duration_min); }}>
                  Use
                </Button>
              </div>
              <div className="flex gap-1 flex-wrap mt-2">
                {(m.tags ?? []).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
              </div>
            </CardContent></Card>
          ))}
          {!meds?.length && <Card><CardContent className="p-6 text-center text-muted-foreground text-sm">No specific types yet — use the timer above with any relaxation track.</CardContent></Card>}
        </div>
      </div>

      <audio ref={audioRef} loop preload="none" />
    </div>
  );
}
