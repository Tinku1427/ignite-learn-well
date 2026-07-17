import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw, Volume2, Sunrise, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Track = {
  id: string; title: string; description: string | null;
  audio_url: string; duration_seconds: number;
  time_of_day: "morning" | "evening" | "any"; coach_name: string | null;
};

export const Route = createFileRoute("/practice/meditate")({ component: Meditate });

function timeBucket(): "morning" | "evening" {
  const h = new Date().getHours();
  return h < 15 ? "morning" : "evening";
}
function fmt(s: number) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function Meditate() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"morning" | "evening">(timeBucket());
  const [active, setActive] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(70);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["meditation-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meditation_tracks")
        .select("id,title,description,audio_url,duration_seconds,time_of_day,coach_name")
        .eq("is_published", true)
        .order("time_of_day", { ascending: true });
      if (error) throw error;
      return data as Track[];
    },
  });

  const list = useMemo(
    () => tracks.filter((t) => t.time_of_day === tab || t.time_of_day === "any"),
    [tracks, tab]
  );

  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol / 100; }, [vol]);

  const logSession = useMutation({
    mutationFn: async (payload: { track_id: string; seconds: number; completed: boolean }) => {
      if (!user) return;
      const { error } = await supabase.from("meditation_sessions").insert({
        user_id: user.id, track_id: payload.track_id,
        duration_seconds: payload.seconds, completed: payload.completed,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-progress"] }),
  });

  const pick = (t: Track) => {
    setActive(t); setPos(0); setPlaying(false);
    setTimeout(() => { audioRef.current?.play().then(() => setPlaying(true)).catch(() => {}); }, 50);
  };
  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
  };
  const reset = () => { if (audioRef.current) { audioRef.current.currentTime = 0; setPos(0); } };
  const onEnded = () => {
    setPlaying(false);
    if (active) logSession.mutate({ track_id: active.id, seconds: Math.round(dur), completed: true });
    toast.success("Practice complete. Notice how you feel.");
  };

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
        <button onClick={() => setTab("morning")} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5", tab === "morning" && "bg-card shadow-sm")}>
          <Sunrise className="size-4" /> Morning
        </button>
        <button onClick={() => setTab("evening")} className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-1.5", tab === "evening" && "bg-card shadow-sm")}>
          <Moon className="size-4" /> Evening
        </button>
      </div>

      {active && (
        <div className="soft-card overflow-hidden">
          <div className="relative bg-gradient-to-br from-sage-soft to-paper p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{active.coach_name ?? "Guided"}</div>
                <h2 className="mt-1 font-display text-2xl md:text-3xl">{active.title}</h2>
                {active.description && <p className="mt-2 max-w-md text-sm text-muted-foreground">{active.description}</p>}
              </div>
              <div className={cn("size-16 rounded-full bg-sage/15 grid place-items-center", playing && "ring-breathe")}>
                <div className="size-10 rounded-full bg-sage/40" />
              </div>
            </div>

            <audio
              ref={audioRef}
              src={active.audio_url}
              onLoadedMetadata={(e) => setDur(e.currentTarget.duration || active.duration_seconds)}
              onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
              onEnded={onEnded}
              preload="metadata"
            />

            <div className="mt-6">
              <Slider
                min={0} max={Math.max(dur, 1)} step={1}
                value={[pos]}
                onValueChange={([v]) => { if (audioRef.current) audioRef.current.currentTime = v; setPos(v); }}
              />
              <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                <span>{fmt(pos)}</span><span>{fmt(dur || active.duration_seconds)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Button onClick={toggle} size="lg" className="rounded-full">
                {playing ? <Pause className="size-5" /> : <Play className="size-5" />}
                <span className="ml-2">{playing ? "Pause" : "Play"}</span>
              </Button>
              <Button variant="outline" size="icon" onClick={reset} className="rounded-full">
                <RotateCcw className="size-4" />
              </Button>
              <div className="ml-auto flex items-center gap-2 text-muted-foreground">
                <Volume2 className="size-4" />
                <Slider className="w-28" min={0} max={100} step={1} value={[vol]} onValueChange={([v]) => setVol(v)} />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">{tab === "morning" ? "Begin the day" : "Wind down"}</h3>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && list.length === 0 && (
          <div className="soft-card p-6 text-sm text-muted-foreground">
            No tracks for this time yet. Ask your coach to publish one.
          </div>
        )}
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id}>
              <button onClick={() => pick(t)} className={cn(
                "w-full soft-card p-4 text-left transition-colors hover:bg-secondary/50",
                active?.id === t.id && "ring-2 ring-primary/30"
              )}>
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{t.coach_name} · {Math.round(t.duration_seconds / 60)} min</div>
                  </div>
                  <Play className="size-4 text-muted-foreground" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
