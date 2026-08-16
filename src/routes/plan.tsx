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
  study:    "bg-secondary border-primary/30",
  practice: "bg-accent/15 border-accent/40",
  break:    "bg-paper border-border",
  rest:     "bg-primary/10 border-primary/25",
};
const TYPE_LABEL: Record<BlockType, string> = {
  study: "Study", practice: "Practice", break: "Break", rest: "Rest",
};

const SUGGESTIONS: Array<{ title: string; type: BlockType; start: string; end: string }> = [
  { title: "Morning meditation", type: "practice", start: "07:00", end: "07:15" },
  { title: "One affirmation",    type: "practice", start: "07:20", end: "07:25" },
  { title: "Study block",        type: "study",    start: "09:00", end: "10:30" },
  { title: "Tea break",          type: "break",    start: "10:30", end: "10:45" },
  { title: "Journal entry",      type: "practice", start: "20:30", end: "20:45" },
  { title: "Evening meditation", type: "practice", start: "21:00", end: "21:15" },
];

const START_HOUR = 6;
const END_HOUR = 23;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR);
const ROW_H = 56; // px per hour — fixed so nothing can collapse or overlap

const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () => Math.random().toString(36).slice(2, 10);

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fmtTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const p = h >= 12 ? "pm" : "am";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")}${p}`;
}
function hourLabel(h: number) {
  return `${((h + 11) % 12) + 1}${h >= 12 ? "pm" : "am"}`;
}

/** Lay blocks out in lanes so overlapping blocks sit side by side, never on top of each other. */
function assignLanes(blocks: Block[]) {
  const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end));
  const laneEnds: number[] = [];
  const placed = sorted.map((b) => {
    const s = toMin(b.start);
    let lane = laneEnds.findIndex((end) => end <= s);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(0); }
    laneEnds[lane] = toMin(b.end);
    return { b, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
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
  useEffect(() => { setBlocks((plan?.blocks as Block[] | undefined) ?? []); }, [plan?.id, plan?.blocks]);

  const save = useMutation({
    mutationFn: async (next: Block[]) => {
      if (!user) return;
      const { error } = await supabase.from("day_plans").upsert(
        { user_id: user.id, plan_date: date, blocks: next },
        { onConflict: "user_id,plan_date" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["day-plan"] }),
  });

  const persist = (next: Block[]) => {
    const sorted = [...next].sort((a, b) => toMin(a.start) - toMin(b.start));
    setBlocks(sorted);
    save.mutate(sorted);
  };

  const [draft, setDraft] = useState<Block>({
    id: "", title: "", type: "study", start: "09:00", end: "10:00",
  });

  const add = () => {
    if (!draft.title.trim()) return;
    if (toMin(draft.end) <= toMin(draft.start)) return;
    persist([...blocks, { ...draft, id: uid(), title: draft.title.trim() }]);
    setDraft((d) => ({ ...d, title: "" }));
  };

  const addSuggestion = (s: (typeof SUGGESTIONS)[number]) =>
    persist([...blocks, { id: uid(), title: s.title, type: s.type, start: s.start, end: s.end }]);

  const toggle = (id: string) => persist(blocks.map((b) => b.id === id ? { ...b, done: !b.done } : b));
  const remove = (id: string) => persist(blocks.filter((b) => b.id !== id));
  const editTime = (id: string, key: "start" | "end", value: string) =>
    persist(blocks.map((b) => b.id === id ? { ...b, [key]: value } : b));

  const doneCount = blocks.filter((b) => b.done).length;

  const { placed, lanes } = useMemo(() => assignLanes(blocks), [blocks]);
  const gridHeight = HOURS.length * ROW_H;

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Plan</div>
        <h1 className="font-display text-3xl">Plan your day</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          A calm plan beats a long one. Leave room to breathe.
        </p>
      </header>

      {/* Suggestion chips */}
      <section className="soft-card p-5">
        <div className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Quick add</div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s.title}
              onClick={() => addSuggestion(s)}
              className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs transition-colors hover:bg-primary/10"
            >
              + {s.title} <span className="text-muted-foreground">{fmtTime(s.start)}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Add form */}
      <section className="soft-card p-5">
        <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">New block</div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-7">
          <input
            className="col-span-2 rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm md:col-span-3"
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
            type="time" aria-label="Start time"
            className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })}
          />
          <input
            type="time" aria-label="End time"
            className="rounded-lg border border-border bg-paper/60 px-2 py-2 text-sm"
            value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })}
          />
          <Button onClick={add} className="col-span-2 rounded-full md:col-span-1">
            <Plus className="mr-1 size-4" /> Add
          </Button>
        </div>
      </section>

      {/* Timeline */}
      <section className="soft-card overflow-hidden p-4 md:p-6">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl">Today's timeline</h2>
          <div className="text-xs text-muted-foreground">{doneCount}/{blocks.length} done</div>
        </div>

        <div className="flex gap-2 md:gap-3">
          {/* hour gutter */}
          <div className="w-11 shrink-0" style={{ height: gridHeight }}>
            {HOURS.map((h) => (
              <div key={h} style={{ height: ROW_H }} className="flex items-start justify-end pr-1 pt-0.5 text-[10px] leading-none text-muted-foreground">
                {hourLabel(h)}
              </div>
            ))}
          </div>

          {/* grid */}
          <div className="relative min-w-0 flex-1 rounded-xl border border-border bg-paper/40" style={{ height: gridHeight }}>
            {HOURS.map((h, i) => (
              <div key={h} className="absolute inset-x-0 border-t border-border/40" style={{ top: i * ROW_H }} />
            ))}

            {blocks.length === 0 && (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm text-muted-foreground">
                <div className="max-w-xs">
                  <Clock className="mx-auto mb-2 size-5" />
                  Nothing planned yet. Start with one meditation and one study block.
                </div>
              </div>
            )}

            {placed.map(({ b, lane }) => {
              const top = ((toMin(b.start) - START_HOUR * 60) / 60) * ROW_H;
              const height = Math.max(30, ((toMin(b.end) - toMin(b.start)) / 60) * ROW_H - 4);
              const widthPct = 100 / lanes;
              return (
                <div
                  key={b.id}
                  className={cn(
                    "absolute overflow-hidden rounded-lg border p-2 shadow-sm",
                    TYPE_TONE[b.type],
                    b.done && "opacity-60",
                  )}
                  style={{
                    top: Math.max(0, top) + 2,
                    height,
                    left: `calc(${lane * widthPct}% + 4px)`,
                    width: `calc(${widthPct}% - 8px)`,
                  }}
                >
                  <div className="flex items-start gap-1.5">
                    <button
                      onClick={() => toggle(b.id)}
                      className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border",
                        b.done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}
                      aria-label={b.done ? "Mark undone" : "Mark done"}
                    >
                      {b.done && <Check className="size-3" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={cn("truncate text-[13px] font-medium leading-tight", b.done && "line-through")}>{b.title}</div>
                      <div className="truncate text-[10px] uppercase tracking-widest text-muted-foreground">
                        {TYPE_LABEL[b.type]} · {fmtTime(b.start)}–{fmtTime(b.end)}
                      </div>
                    </div>
                    <button onClick={() => remove(b.id)} aria-label="Remove block" className="text-muted-foreground hover:text-foreground">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Editable list — the reliable way to adjust times on a phone */}
      {blocks.length > 0 && (
        <section className="soft-card p-5">
          <div className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Adjust blocks</div>
          <ul className="space-y-2">
            {blocks.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-paper/40 p-3">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{b.title}</span>
                <input type="time" aria-label={`${b.title} start`} value={b.start}
                  onChange={(e) => editTime(b.id, "start", e.target.value)}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs" />
                <input type="time" aria-label={`${b.title} end`} value={b.end}
                  onChange={(e) => editTime(b.id, "end", e.target.value)}
                  className="rounded-lg border border-border bg-card px-2 py-1 text-xs" />
                <button onClick={() => remove(b.id)} aria-label={`Remove ${b.title}`} className="text-muted-foreground hover:text-foreground">
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
