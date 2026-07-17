import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/practice/mood")({ component: Mood });

const MOODS = [
  { v: 1, e: "😞", l: "Rough" },
  { v: 2, e: "😕", l: "Low" },
  { v: 3, e: "😐", l: "Okay" },
  { v: 4, e: "🙂", l: "Good" },
  { v: 5, e: "😄", l: "Bright" },
];
const TAGS = ["exam-stress", "tired", "distracted", "anxious", "grateful", "focused", "lonely", "hopeful"];

function Mood() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const { data: recent = [] } = useQuery({
    enabled: !!user,
    queryKey: ["mood-recent", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("mood_checkins")
        .select("mood_score,energy,tags,note,created_at")
        .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(7);
      return data ?? [];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user || mood == null) return;
      const { error } = await supabase.from("mood_checkins").insert({
        user_id: user.id, mood_score: mood, energy, tags, note: note.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setMood(null); setNote(""); setTags([]);
      toast.success("Noted. No wrong answer.");
      qc.invalidateQueries({ queryKey: ["mood-recent"] });
    },
  });

  const toggleTag = (t: string) =>
    setTags((cur) => cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);

  return (
    <div className="space-y-6">
      <div className="soft-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Right now</div>
        <div className="mt-1 font-display text-xl">How's the weather inside?</div>

        <div className="mt-5 grid grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button key={m.v} onClick={() => setMood(m.v)} className={cn(
              "flex flex-col items-center rounded-2xl border border-border p-3 transition-all",
              mood === m.v ? "bg-sage-soft border-primary scale-105" : "hover:bg-secondary/50"
            )}>
              <span className="text-2xl">{m.e}</span>
              <span className="mt-1 text-[11px] text-muted-foreground">{m.l}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs text-muted-foreground">
            <span>Energy</span><span>{energy}/5</span>
          </div>
          <Slider min={1} max={5} step={1} value={[energy]} onValueChange={([v]) => setEnergy(v)} />
        </div>

        <div className="mt-6">
          <div className="mb-2 text-xs text-muted-foreground">Any of these?</div>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((t) => (
              <button key={t} onClick={() => toggleTag(t)} className={cn(
                "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                tags.includes(t) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
              )}>{t}</button>
            ))}
          </div>
        </div>

        <textarea
          value={note} onChange={(e) => setNote(e.target.value)}
          placeholder="A sentence, if you want."
          className="mt-5 w-full rounded-xl border border-border bg-paper/60 p-3 text-sm"
          rows={2}
        />

        <Button
          onClick={() => save.mutate()}
          disabled={mood == null || save.isPending}
          className="mt-5 w-full rounded-full"
        >{save.isPending ? "Saving…" : "Check in"}</Button>
      </div>

      {recent.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Last 7 check-ins</h3>
          <div className="soft-card flex items-end justify-between gap-2 p-4">
            {recent.slice().reverse().map((r, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-sage/60" style={{ height: `${r.mood_score * 14}px` }} />
                <span className="text-[10px] text-muted-foreground">{MOODS.find((m) => m.v === r.mood_score)?.e}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
