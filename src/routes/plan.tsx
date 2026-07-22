import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan")({
  component: () => <Protected><Plan /></Protected>,
});

type BlockType = "study" | "practice" | "break" | "rest";
type Block = {
  id: string;
  title: string;
  type: BlockType;
  subject?: string;
  start: string; // "HH:MM"
  end: string;
  done?: boolean;
};

const TYPE_TONE: Record<BlockType, string> = {
  study:    "bg-sage-soft border-sage/40",
  practice: "bg-apricot/20 border-apricot/40",
  break:    "bg-secondary border-border",
  rest:     "bg-dusk/15 border-dusk/40",
};
const TYPE_LABEL: Record<BlockType, string> = {
  study: "Study", practice: "Practice", break: "Break", rest: "Rest",
};

const SUGGESTIONS: Array<Omit<Block, "id" | "start" | "end" | "done">> = [
  { title: "Morning meditation", type: "practice" },
  { title: "One affirmation",    type: "practice" },
  { title: "Journal entry",      type: "practice" },
  { title: "Evening meditation", type: "practice" },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6..23
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "pm" : "am";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")}${p}`;
}

function Plan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const date = todayISO();

  const { data: plan } = useQuery({
    enabled: !!user,
    queryKey: ["day-plan", user?.id, date],
    queryFn: async () => {
      const { data } = await supabase
        .from("day_plans")
        .select("id, blocks")
        .eq("user_id", user!.id)
        .eq("plan_date", date)
        .maybeSingle();
      return data as { id: string; blocks: Block[] } | null;
    },
  });

  const [blocks, setBlocks] = useState<Block[]>([]);
  useEffect(() => { setBlocks(plan?.blocks ?? []); }, [plan?.id]);

  const save = useMutation({
    mutationFn: async (next: Block[]) => {
      if (!user) return;
      await supabase.from("day_plans").upsert(
        { user_id: user.id, plan_date: date, blocks: next },
        { onConflict: "user_id,plan_date" },
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["day-plan"] }),
  });

  const persist = (next: Block[]) => { setBlocks(next); save.mutate(next); };

  const [draft, setDraft] = useState<Block>({
    id: "", title: "", type: "study", start: "09:00", end: "10:00", subject: "",
  });

  const add = () => {
    if (!draft.title.trim()) return;
    if (toMin(draft.end) <= toMin(draft.start)) return;
    const next = [...blocks, { ...draft, id: uid() }].sort((a, b) => toMin(a.start) - toMin(b.start));
    persist(next);
    setDraft((d) => ({ ...d, title: "", subject: "" }));
  };

  const addSuggestion = (s: (typeof SUGGESTIONS)[number]) => {
    const start = s.title.startsWith("Morning") ? "07:00"
                : s.title.startsWith("Evening") ? "21:00"
                : "12:30";
    const end = s.title.startsWith("Morning") ? "07:10"
              : s.title.startsWith("Evening") ? "21:10"
              : "12:40";
    const b: Block = { ...s, id: uid(), start, end };
    persist([...blocks, b].sort((a, b) => toMin(a.start) - toMin(b.start)));
  };

  const toggle = (id: string) => persist(blocks.map((b) => b.id === id ? { ...b, done: !b.done } : b));
  const remove = (id: string) => persist(blocks.filter((b) => b.id !== id));

  const doneCount = blocks.filter((b) => b.done).length;

  // vertical timeline geometry: 6:00 → 23:00 = 17 hours → 68 quarter-hour slots
  const TIMELINE_START = 6 * 60;
  const TIMELINE_END = 23 * 60;
  const total = TIMELINE_END - TIMELINE_START;

  const positioned = useMemo(() => blocks.map((b) => {
    const top = Math.max(0, (toMin(b.start) - TIMELINE_START) / total) * 100;
    const height = Math.max(2, (toMin(b.end) - toMin(b.start)) / total) * 100;
    return { b, top, height };
  }), [blocks]);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Plan</div>
        <h1 className="font-display text-3xl">Your day</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          A calm plan beats a long one. Leave room to breathe.
        </p>
      </header>

      {/* Suggestions */}
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Add today's practice</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s.title} onClick={() => addSuggestion(s)}
              className="rounded-full border border-border bg-apricot/15 hover:bg-apricot/25 px-3 py-1.5 text-xs">
              + {s.title}
            </button>
          ))}
        </div>
      </section>

      {/* Add form */}
      <section className="soft-card p-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">New block</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-6">
          <input
            className="col-span-2 rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-2"
            placeholder="Physics — chapter 4"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <select
            className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as BlockType })}
          >
            <option value="study">Study</option>
            <option value="practice">Practice</option>
            <option value="break">Break</option>
            <option value="rest">Rest</option>
          </select>
          <input
            type="time" className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          />
          <input
            type="time" className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })}
          />
          <Button onClick={add} className="rounded-full">
            <Plus className="size-4 mr-1" /> Add
          </Button>
        </div>
      </section>

      {/* Timeline */}
      <section className="soft-card p-4 md:p-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-xl">Today's timeline</h2>
          <div className="text-xs text-muted-foreground">
            {doneCount}/{blocks.length} done
          </div>
        </div>

        <div className="relative flex gap-3">
          <div className="w-10 shrink-0 text-[11px] text-muted-foreground">
            {HOURS.map((h) => (
              <div key={h} style={{ height: `${100 / HOURS.length}%` }} className="flex items-start justify-end pr-1 h-[52px]">
                {((h + 11) % 12) + 1}{h >= 12 ? "p" : "a"}
              </div>
            ))}
          </div>

          <div className="relative flex-1 rounded-xl border border-border bg-paper/40" style={{ height: HOURS.length * 52 }}>
            {HOURS.map((_, i) => (
              <div key={i} className="absolute inset-x-0 border-t border-border/50" style={{ top: (i / HOURS.length) * 100 + "%" }} />
            ))}

            {positioned.length === 0 && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground p-4 text-center">
                <div className="max-w-xs">
                  <Clock className="mx-auto mb-2 size-5" />
                  Nothing planned yet. Start with one meditation and one study block.
                </div>
              </div>
            )}

            {positioned.map(({ b, top, height }) => (
              <div key={b.id}
                className={cn(
                  "absolute left-1 right-1 rounded-lg border p-2 shadow-sm flex flex-col justify-between",
                  TYPE_TONE[b.type],
                  b.done && "opacity-60"
                )}
                style={{ top: `${top}%`, height: `${height}%`, minHeight: 36 }}
              >
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggle(b.id)}
                    className={cn("mt-0.5 grid size-4 place-items-center rounded-full border shrink-0",
                      b.done ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card")}
                    aria-label={b.done ? "Mark undone" : "Mark done"}
                  >
                    {b.done && <Check className="size-3" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className={cn("text-sm font-medium truncate", b.done && "line-through")}>{b.title}</div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {TYPE_LABEL[b.type]} · {fmtTime(b.start)}–{fmtTime(b.end)}
                    </div>
                  </div>
                  <button onClick={() => remove(b.id)} className="text-muted-foreground hover:text-foreground">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
