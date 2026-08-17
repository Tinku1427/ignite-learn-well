import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { TouchSlider } from "@/components/touch-slider";
import { Scene } from "@/components/scene";
import { Celebrate } from "@/components/celebrate";
import { Play, Pause, RotateCcw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
const yogaFocus = { url: "/focus.svg" };

export const Route = createFileRoute("/focus")({
  component: () => <Protected><Focus /></Protected>,
});

type Ambient = { id: string; title: string; audio_url: string; category: string | null };
type Phase = "idle" | "focus" | "break-locked" | "break" | "done";

const WORK_MIN_OPTIONS = [15, 25, 45];
const BREAK_MIN = 5;
const BREAK_LOCK_SECS = 30; // enforced pause before break can be skipped

function fmt(s: number) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function Focus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [work, setWork] = useState(25);
  const [phase, setPhase] = useState<Phase>("idle");
  const [remain, setRemain] = useState(work * 60);
  const [lockRemain, setLockRemain] = useState(BREAK_LOCK_SECS);
  const [ambientId, setAmbientId] = useState<string>("");
  const [vol, setVol] = useState(35);
  const [celebrate, setCelebrate] = useState(false);
  const timer = useRef<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const { data: tracks = [] } = useQuery({
    queryKey: ["ambient-tracks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ambient_tracks")
        .select("id,title,audio_url,category").eq("is_published", true);
      if (error) throw error;
      return data as Ambient[];
    },
  });
  const ambient = useMemo(() => tracks.find((t) => t.id === ambientId) ?? null, [tracks, ambientId]);

  useEffect(() => {
    if (audio.current) audio.current.volume = vol / 100;
  }, [vol]);

  // control ambient with phase
  useEffect(() => {
    if (!audio.current) return;
    if (phase === "focus") audio.current.play().catch(() => {});
    else audio.current.pause();
  }, [phase, ambientId]);

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current); }, []);

  const logSession = useMutation({
    mutationFn: async (payload: { planned: number; actual: number; completed: boolean; breaks: number }) => {
      if (!user) return;
      const { error } = await supabase.from("focus_sessions").insert({
        user_id: user.id,
        planned_minutes: payload.planned,
        actual_minutes: payload.actual,
        completed: payload.completed,
        breaks_taken: payload.breaks,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["today-progress"] }),
  });

  const startFocus = () => {
    setPhase("focus");
    setRemain(work * 60);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setRemain((r) => {
        if (r <= 1) {
          window.clearInterval(timer.current!); timer.current = null;
          enterBreakLock();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const enterBreakLock = () => {
    setPhase("break-locked");
    setLockRemain(BREAK_LOCK_SECS);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setLockRemain((r) => {
        if (r <= 1) {
          window.clearInterval(timer.current!); timer.current = null;
          startBreak();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const startBreak = () => {
    setPhase("break");
    setRemain(BREAK_MIN * 60);
    if (timer.current) window.clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      setRemain((r) => {
        if (r <= 1) {
          window.clearInterval(timer.current!); timer.current = null;
          setPhase("done");
          logSession.mutate({ planned: work, actual: work, completed: true, breaks: 1 });
          setCelebrate(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    const done = phase === "focus" ? work - Math.ceil(remain / 60) : work;
    if (phase === "focus" && done > 0) {
      logSession.mutate({ planned: work, actual: done, completed: false, breaks: 0 });
    }
    setPhase("idle"); setRemain(work * 60);
  };

  return (
    <>
      <Celebrate scene="focus" open={celebrate} onClose={() => setCelebrate(false)}
        next={{ label: "Meditate", hint: "A five-minute wind-down when you're ready." }} />

      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Focus</div>
        <h1 className="font-display text-3xl">A single session at a time</h1>
      </header>

      <div className="soft-card p-6 md:p-8">
        <div className="flex flex-col items-center gap-4">
          <div className={cn("relative grid place-items-center rounded-full bg-apricot/25 p-5", phase === "done" && "scene-hop")} style={{ width: 180, height: 180 }}>
            <img src={yogaFocus.url} alt="" aria-hidden="true" className="h-[130px] w-[130px] object-contain" />
          </div>
          <div className="font-display text-5xl tabular-nums">
            {phase === "break-locked" ? fmt(lockRemain) : fmt(remain)}
          </div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            {phase === "idle" && "Ready when you are"}
            {phase === "focus" && "Focus"}
            {phase === "break-locked" && "Break — sit with it"}
            {phase === "break" && "Break — stretch, look far"}
            {phase === "done" && "Done"}
          </div>
        </div>

        {phase === "idle" && (
          <>
            <div className="mt-6 flex justify-center gap-2">
              {WORK_MIN_OPTIONS.map((m) => (
                <button key={m}
                  onClick={() => { setWork(m); setRemain(m * 60); }}
                  className={cn("rounded-full border border-border px-4 py-1.5 text-sm",
                    work === m ? "bg-primary text-primary-foreground border-primary ring-2 ring-primary/40 shadow-[0_0_0_5px_rgba(0,60,148,0.10)] motion-safe:scale-[1.05]" : "hover:bg-secondary opacity-70")}>
                  {m} min
                </button>
              ))}
            </div>
            <div className="mt-5">
              <div className="mb-2 text-xs text-muted-foreground">Ambient (optional)</div>
              <select value={ambientId} onChange={(e) => setAmbientId(e.target.value)}
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <option value="">Silence</option>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              {ambient && (
                <div className="mt-3 flex items-center gap-2 text-muted-foreground">
                  <Volume2 className="size-4 shrink-0" />
                  <TouchSlider min={0} max={100} step={1} value={vol} onChange={setVol} ariaLabel="Ambient volume" />
                </div>
              )}
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" className="rounded-full" onClick={startFocus}>
                <Play className="mr-2 size-5" /> Begin {work} minutes
              </Button>
            </div>
          </>
        )}

        {phase === "focus" && (
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" className="rounded-full" onClick={stop}>
              <Pause className="mr-2 size-4" /> Stop
            </Button>
          </div>
        )}

        {phase === "break-locked" && (
          <div className="mt-6 space-y-3 text-center">
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              The break is real. Look up from the screen. Stretch. Drink water. Skipping the break is what makes the next hour worse — not the break itself.
            </p>
            <div className="text-xs text-muted-foreground">You can move on in {lockRemain}s.</div>
          </div>
        )}

        {phase === "break" && (
          <div className="mt-6 space-y-3 text-center">
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">
              Eyes soft. Shoulders down. Nowhere to be.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => { setPhase("idle"); setRemain(work * 60); }}>
              End early
            </Button>
          </div>
        )}

        {phase === "done" && (
          <div className="mt-6 text-center">
            <Button size="lg" className="rounded-full" onClick={() => { setPhase("idle"); setRemain(work * 60); }}>
              Another round
            </Button>
          </div>
        )}
      </div>

      {ambient && (
        <audio ref={audio} src={ambient.audio_url} loop preload="metadata" />
      )}
    </>
  );
}
