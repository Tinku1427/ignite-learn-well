import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Wind, Pause, Play, RotateCcw, SkipForward, Music, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { useAudioTracks, TrackChips, type AudioTrack } from "@/components/audio-picker";

export const Route = createFileRoute("/focus")({
  head: () => ({ meta: [{ title: "Focus Timer — Guiding Mentor" }] }),
  component: () => <Protected><Focus /></Protected>,
});

const PRESETS = [5, 25, 45, 90];
const breakFor = (d: number) => (d >= 90 ? 20 : d >= 45 ? 10 : d >= 25 ? 5 : 2);

function Focus() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [duration, setDuration] = useState(25);
  const [custom, setCustom] = useState("");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);
  const [focusTrack, setFocusTrack] = useState<AudioTrack | null>(null);
  const [relaxTrack, setRelaxTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(0.6);
  const [showMusic, setShowMusic] = useState(false);

  const focusTracks = useAudioTracks("focus");
  const relaxTracks = useAudioTracks("relax");

  const { data: profile } = useQuery({
    queryKey: ["profile-tracks", uid],
    queryFn: async () => (await supabase.from("profiles").select("preferred_focus_track_id,preferred_relax_track_id").eq("id", uid!).maybeSingle()).data,
    enabled: !!uid,
  });

  // Hydrate preferred tracks once loaded
  useEffect(() => {
    if (profile && focusTracks.data && !focusTrack) {
      const t = focusTracks.data.find((x) => x.id === profile.preferred_focus_track_id);
      if (t) setFocusTrack(t);
    }
  }, [profile, focusTracks.data]); // eslint-disable-line
  useEffect(() => {
    if (profile && relaxTracks.data && !relaxTrack) {
      const t = relaxTracks.data.find((x) => x.id === profile.preferred_relax_track_id);
      if (t) setRelaxTrack(t);
    }
  }, [profile, relaxTracks.data]); // eslint-disable-line

  const savePref = useMutation({
    mutationFn: async (patch: { preferred_focus_track_id?: string | null; preferred_relax_track_id?: string | null }) => {
      if (!uid) return;
      await supabase.from("profiles").update(patch).eq("id", uid);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-tracks", uid] }),
  });

  useEffect(() => { setRemaining(duration * 60); setPhase("work"); setRunning(false); }, [duration]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    if (!running) { if (audioRef.current) audioRef.current.pause(); return; }
    // Play appropriate track for current phase if chosen
    const t = phase === "work" ? focusTrack : relaxTrack;
    if (t && audioRef.current) {
      if (audioRef.current.src !== t.url) audioRef.current.src = t.url;
      audioRef.current.play().catch(() => {});
    }
    tickRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(tickRef.current!);
          setRunning(false);
          onPhaseEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const onPhaseEnd = async () => {
    if (phase === "work") {
      if (uid) await supabase.from("pomodoro_sessions").insert({ user_id: uid, duration_min: duration });
      celebrate(`${duration} min done. Take that break — you earned it. 🌿`);
      setPhase("break");
      setRemaining(breakFor(duration) * 60);
      if (audioRef.current) audioRef.current.pause();
    } else {
      toast.success("Break over. Ready for another session?");
      setPhase("work");
      setRemaining(duration * 60);
      if (audioRef.current) audioRef.current.pause();
    }
  };

  const playRelaxNow = () => {
    if (!relaxTrack && relaxTracks.data?.length) setRelaxTrack(relaxTracks.data[0]);
    setTimeout(() => {
      const t = relaxTrack ?? relaxTracks.data?.[0];
      if (t && audioRef.current) {
        audioRef.current.src = t.url;
        audioRef.current.play().catch(() => {});
      }
    }, 50);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const total = phase === "work" ? duration * 60 : breakFor(duration) * 60;
  const pct = ((total - remaining) / total) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Focus timer</h1>
        <p className="text-muted-foreground text-sm">Deep work with restorative breaks.</p>
      </div>

      <Card><CardContent className="p-8">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {PRESETS.map((p) => (
            <Button key={p} variant={duration === p ? "default" : "outline"} onClick={() => setDuration(p)}>{p} min</Button>
          ))}
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = Number(custom); if (n > 0 && n <= 180) setDuration(n); }}>
            <Input type="number" placeholder="Custom" className="w-24" value={custom} onChange={(e) => setCustom(e.target.value)} />
            <Button variant="outline" type="submit">Set</Button>
          </form>
        </div>

        <div className="relative mx-auto max-w-sm">
          <div className={`aspect-square rounded-full grid place-items-center ${phase === "break" ? "gradient-warm" : "gradient-calm"} text-primary-foreground`}>
            <div className="text-center">
              <div className="uppercase tracking-widest text-xs opacity-80">{phase === "work" ? "Focus" : "Break"}</div>
              <div className="font-display text-6xl md:text-7xl font-semibold tabular-nums">{mm}:{ss}</div>
              <div className="text-sm opacity-80 mt-2">
                {phase === "work" ? `${duration} min session` : `${breakFor(duration)} min break`}
              </div>
            </div>
          </div>
          <div className="h-1.5 mt-4 bg-secondary rounded-full overflow-hidden">
            <div className={`h-full ${phase === "break" ? "bg-accent" : "bg-primary"} transition-all`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6 flex-wrap">
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="gap-2">
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setRunning(false); setRemaining((phase === "work" ? duration : breakFor(duration)) * 60); }} className="gap-2">
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button size="lg" variant="ghost" onClick={onPhaseEnd} className="gap-2">
            <SkipForward className="size-4" /> Skip
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setShowMusic((s) => !s)} className="gap-2">
            <Music className="size-4" /> Music {showMusic ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
        </div>

        {showMusic && (
          <div className="mt-6 rounded-xl border p-4 space-y-4 bg-secondary/30">
            <div>
              <div className="text-sm font-medium mb-2">Focus tracks (during session)</div>
              <TrackChips
                tracks={focusTracks.data ?? []}
                selectedId={focusTrack?.id ?? null}
                onSelect={(t) => { setFocusTrack(t); savePref.mutate({ preferred_focus_track_id: t.id }); if (running && phase === "work" && audioRef.current) { audioRef.current.src = t.url; audioRef.current.play().catch(() => {}); } }}
                onStop={() => { setFocusTrack(null); savePref.mutate({ preferred_focus_track_id: null }); audioRef.current?.pause(); }}
              />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Relaxation tracks (during break)</div>
              <TrackChips
                tracks={relaxTracks.data ?? []}
                selectedId={relaxTrack?.id ?? null}
                onSelect={(t) => { setRelaxTrack(t); savePref.mutate({ preferred_relax_track_id: t.id }); if (phase === "break" && audioRef.current) { audioRef.current.src = t.url; audioRef.current.play().catch(() => {}); } }}
                onStop={() => { setRelaxTrack(null); savePref.mutate({ preferred_relax_track_id: null }); audioRef.current?.pause(); }}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Volume</div>
              <Slider value={[Math.round(volume * 100)]} min={0} max={100} step={5} onValueChange={(v) => setVolume((v[0] ?? 0) / 100)} />
            </div>
            <p className="text-xs text-muted-foreground">Off by default. Your pick is remembered next time.</p>
          </div>
        )}
      </CardContent></Card>

      {phase === "break" && (
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3"><Wind className="size-4 text-primary" /><span className="font-medium">Break — take a breath</span></div>
          <p className="text-sm text-muted-foreground mb-3">
            {relaxTrack ? `Ready when you are: ${relaxTrack.title}` : "Try a relaxation track — one tap and it plays until your break ends."}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={playRelaxNow} className="gap-2"><Play className="size-4" /> Play relaxation music</Button>
            <Button variant="ghost" onClick={() => audioRef.current?.pause()}>Pause</Button>
          </div>
          <div className="mt-4">
            <TrackChips
              tracks={relaxTracks.data ?? []}
              selectedId={relaxTrack?.id ?? null}
              onSelect={(t) => { setRelaxTrack(t); savePref.mutate({ preferred_relax_track_id: t.id }); if (audioRef.current) { audioRef.current.src = t.url; audioRef.current.play().catch(() => {}); } }}
              onStop={() => { audioRef.current?.pause(); }}
            />
          </div>
        </CardContent></Card>
      )}

      <audio ref={audioRef} loop preload="none" />
    </div>
  );
}
