import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wind, Music, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";

export const Route = createFileRoute("/focus")({
  head: () => ({ meta: [{ title: "Focus Timer — Guiding Mentor" }] }),
  component: () => <Protected><Focus /></Protected>,
});

const PRESETS = [5, 25, 45, 90];
const breakFor = (d: number) => (d >= 90 ? 20 : d >= 45 ? 10 : d >= 25 ? 5 : 2);

const AMBIENT: Record<string, string> = {
  rain: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8e5fc1a4c.mp3?filename=light-rain-109591.mp3",
  lofi: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_8fdc1e9b7d.mp3?filename=lofi-study-112191.mp3",
  breathing: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_270f49b83f.mp3?filename=meditation-amp-relaxation-music-22174.mp3",
};

function Focus() {
  const { user } = useAuth();
  const uid = user?.id;
  const [duration, setDuration] = useState(25);
  const [custom, setCustom] = useState("");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [ambient, setAmbient] = useState<string>("rain");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => { setRemaining(duration * 60); setPhase("work"); setRunning(false); }, [duration]);

  useEffect(() => {
    if (!running) return;
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
      setTimeout(() => setRunning(true), 500);
      // play ambient
      if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
    } else {
      toast.success("Break over. Ready for another session?");
      setPhase("work");
      setRemaining(duration * 60);
      if (audioRef.current) audioRef.current.pause();
    }
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

        <div className="flex justify-center gap-2 mt-6">
          <Button size="lg" onClick={() => setRunning((r) => !r)} className="gap-2">
            {running ? <><Pause className="size-4" /> Pause</> : <><Play className="size-4" /> Start</>}
          </Button>
          <Button size="lg" variant="outline" onClick={() => { setRunning(false); setRemaining((phase === "work" ? duration : breakFor(duration)) * 60); }} className="gap-2">
            <RotateCcw className="size-4" /> Reset
          </Button>
          <Button size="lg" variant="ghost" onClick={onPhaseEnd} className="gap-2">
            <SkipForward className="size-4" /> Skip
          </Button>
        </div>
      </CardContent></Card>

      {phase === "break" && (
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3"><Wind className="size-4 text-primary" /><span className="font-medium">Break — take a breath</span></div>
          <p className="text-sm text-muted-foreground mb-3">Try a short relaxation. Pick a sound below or breathe with the circle.</p>
          <div className="flex gap-2 flex-wrap">
            {Object.keys(AMBIENT).map((k) => (
              <Button key={k} size="sm" variant={ambient === k ? "default" : "outline"} onClick={() => {
                setAmbient(k);
                if (audioRef.current) { audioRef.current.src = AMBIENT[k]; audioRef.current.play().catch(() => {}); }
              }} className="gap-2"><Music className="size-3" />{k}</Button>
            ))}
            <Button size="sm" variant="ghost" onClick={() => audioRef.current?.pause()}>Stop sound</Button>
          </div>
          <audio ref={audioRef} loop src={AMBIENT[ambient]} preload="none" />
        </CardContent></Card>
      )}
    </div>
  );
}
