import { MessagesCard } from "@/components/messages-card";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleGate } from "@/components/role-gate";
import { StaffShell } from "@/components/staff-shell";
import { Scene } from "@/components/scene";
import { AppIcon } from "@/components/app-icon";
import { MoodFace, type MoodValue } from "@/components/mood-face";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  component: () => (
    <RoleGate role={["coach", "counsellor"]}>
      <StaffShell title="Guiding Mentor" subtitle="Coach" nav={[
        { to: "/coach", label: "My caseload" },
      ]}>
        <CoachHome />
      </StaffShell>
    </RoleGate>
  ),
});

const DAY = 86400000;
const since = (days: number) => new Date(Date.now() - days * DAY).toISOString();

const bandTone = (b: string) =>
  b === "green" ? "bg-secondary text-primary"
  : b === "amber" ? "bg-accent/25 text-foreground"
  : "bg-primary/15 text-primary";

type Student = {
  id: string;
  full_name: string | null;
  composite: number | null;
  risk_band: string;
  score_date: string | null;
  moods: { mood_score: number; created_at: string }[];
  activeDays: number;
  meditations: number;
};

function CoachHome() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: caseload = [], isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["coach-caseload", user?.id],
    queryFn: async (): Promise<Student[]> => {
      const { data: assigns, error } = await supabase
        .from("coach_assignments")
        .select("student_id")
        .eq("coach_id", user!.id);
      if (error) throw error;
      const ids = (assigns ?? []).map((a) => a.student_id);
      if (!ids.length) return [];

      const [profs, scores, moods, meds] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", ids),
        supabase.from("wellness_scores")
          .select("user_id, composite, risk_band, score_date")
          .in("user_id", ids).order("score_date", { ascending: false }),
        supabase.from("mood_checkins")
          .select("user_id, mood_score, created_at")
          .in("user_id", ids).gte("created_at", since(14)).order("created_at", { ascending: true }),
        supabase.from("meditation_sessions")
          .select("user_id, created_at, completed")
          .in("user_id", ids).gte("created_at", since(14)),
      ]);

      const latest = new Map<string, { composite: number; risk_band: string; score_date: string }>();
      for (const s of scores.data ?? []) {
        if (!latest.has(s.user_id)) latest.set(s.user_id, {
          composite: Number(s.composite), risk_band: s.risk_band, score_date: s.score_date,
        });
      }

      const moodMap = new Map<string, { mood_score: number; created_at: string }[]>();
      const dayMap = new Map<string, Set<string>>();
      for (const m of moods.data ?? []) {
        const arr = moodMap.get(m.user_id) ?? [];
        arr.push({ mood_score: m.mood_score, created_at: m.created_at });
        moodMap.set(m.user_id, arr);
        const set = dayMap.get(m.user_id) ?? new Set<string>();
        set.add(m.created_at.slice(0, 10));
        dayMap.set(m.user_id, set);
      }
      const medCount = new Map<string, number>();
      for (const s of meds.data ?? []) {
        medCount.set(s.user_id, (medCount.get(s.user_id) ?? 0) + 1);
        const set = dayMap.get(s.user_id) ?? new Set<string>();
        set.add((s.created_at as string).slice(0, 10));
        dayMap.set(s.user_id, set);
      }

      const rows: Student[] = ids.map((id) => {
        const l = latest.get(id);
        return {
          id,
          full_name: (profs.data ?? []).find((p) => p.id === id)?.full_name ?? null,
          composite: l?.composite ?? null,
          risk_band: l?.risk_band ?? "unknown",
          score_date: l?.score_date ?? null,
          moods: moodMap.get(id) ?? [],
          activeDays: dayMap.get(id)?.size ?? 0,
          meditations: medCount.get(id) ?? 0,
        };
      });

      const order: Record<string, number> = { watch: 0, amber: 1, unknown: 2, green: 3 };
      rows.sort((a, b) =>
        (order[a.risk_band] ?? 4) - (order[b.risk_band] ?? 4) ||
        (a.composite ?? 0) - (b.composite ?? 0));
      return rows;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["coach-events"],
    queryFn: async () => {
      const { data } = await supabase.from("agent_events")
        .select("id,user_id,event_type,detail,created_at")
        .order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  const { data: notes = [] } = useQuery({
    enabled: !!user,
    queryKey: ["coach-notes", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("coach_notes")
        .select("id, student_id, note, follow_up_on, created_at")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const addNote = useMutation({
    mutationFn: async ({ studentId, note }: { studentId: string; note: string }) => {
      const { error } = await supabase.from("coach_notes")
        .insert({ coach_id: user!.id, student_id: studentId, note });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Check-in note saved."); qc.invalidateQueries({ queryKey: ["coach-notes"] }); },
    onError: (e: unknown) => toast.error((e as { message?: string })?.message ?? "Could not save the note."),
  });

  const flags = events.filter((e) => e.event_type === "crisis_flag");
  const nameOf = (id: string) => caseload.find((r) => r.id === id)?.full_name ?? "A student";

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
            <AppIcon name="mentor" size={14} /> Coach
          </div>
          <h1 className="mt-1 font-display text-3xl">Who needs a check-in today</h1>
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            Only the students assigned to you. You see scores, mood trend and habit consistency — never the diary.
          </p>
        </div>
        <Scene kind="ambient" size={96} />
      </header>

      <MessagesCard title="From the admin" />

      {flags.length > 0 && (
        <section className="soft-card border-primary/30 bg-secondary/60 p-5">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Reach out first</div>
          <h2 className="mt-1 font-display text-xl">Safety signal detected</h2>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Language suggesting self-harm appeared in a check-in. The words stay private — call them today.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {flags.slice(0, 8).map((f) => (
              <li key={f.id as string} className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2">
                <span className="font-medium">{nameOf(f.user_id as string)}</span>
                <span className="text-xs text-muted-foreground">{new Date(f.created_at as string).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Caseload — ranked by risk</h2>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        <div className="space-y-3">
          {caseload.map((s) => (
            <StudentCard
              key={s.id}
              student={s}
              notes={notes.filter((n) => n.student_id === s.id)}
              onNote={(note) => addNote.mutate({ studentId: s.id, note })}
              saving={addNote.isPending}
            />
          ))}
          {!isLoading && caseload.length === 0 && (
            <div className="soft-card p-6 text-sm text-muted-foreground">
              No students are assigned to you yet. An admin adds students to your caseload.
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recent agent events</h2>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id as string} className="soft-card flex justify-between p-3 text-sm">
              <span className="font-medium">{(e.event_type as string).replace(/_/g, " ")}</span>
              <span className="text-xs text-muted-foreground">{new Date(e.created_at as string).toLocaleString()}</span>
            </li>
          ))}
          {events.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No events yet.</div>}
        </ul>
      </section>
    </div>
  );
}

function MoodSpark({ moods }: { moods: { mood_score: number }[] }) {
  if (moods.length === 0) return <span className="text-xs text-muted-foreground">No mood check-ins</span>;
  const pts = moods.slice(-14);
  const w = 120, h = 28;
  const line = pts.map((m, i) => {
    const x = pts.length === 1 ? w / 2 : (i / (pts.length - 1)) * w;
    const y = h - ((m.mood_score - 1) / 4) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-label="Mood trend, last 14 days" className="text-primary">
      <polyline fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" points={line} />
    </svg>
  );
}

function StudentCard({
  student, notes, onNote, saving,
}: {
  student: Student;
  notes: { id: string; note: string; created_at: string }[];
  onNote: (note: string) => void;
  saving: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const latestMood = student.moods.at(-1)?.mood_score;
  const trend = (() => {
    if (student.moods.length < 4) return "→";
    const half = Math.floor(student.moods.length / 2);
    const avg = (a: typeof student.moods) => a.reduce((t, m) => t + m.mood_score, 0) / a.length;
    const d = avg(student.moods.slice(half)) - avg(student.moods.slice(0, half));
    return d > 0.4 ? "↑" : d < -0.4 ? "↓" : "→";
  })();

  return (
    <div className="soft-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{student.full_name ?? "Student"}</div>
          <div className="text-xs text-muted-foreground">
            {student.score_date ? `Last score ${student.score_date}` : "No wellness score yet"} · {student.activeDays}/14 active days · {student.meditations} meditations
          </div>
        </div>
        <div className="flex items-center gap-3">
          {latestMood && <MoodFace value={Math.min(5, Math.max(1, latestMood)) as MoodValue} size={30} />}
          <MoodSpark moods={student.moods} />
          <span className="text-sm text-muted-foreground">{trend}</span>
          <span className="font-display text-2xl tabular-nums">
            {student.composite === null ? "—" : Math.round(student.composite)}
          </span>
          <span className={cn("rounded-full px-2 py-1 text-[10px] uppercase tracking-widest", bandTone(student.risk_band))}>
            {student.risk_band}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide notes" : `Check-in notes (${notes.length})`}
        </Button>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-border bg-paper/40 p-3 text-sm">
                <div className="whitespace-pre-wrap">{n.note}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
              </li>
            ))}
            {notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
          </ul>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What did you talk about? What is the follow-up?"
            rows={3}
          />
          <Button
            size="sm" className="rounded-full" disabled={saving || !draft.trim()}
            onClick={() => { onNote(draft.trim()); setDraft(""); }}
          >
            Save note
          </Button>
        </div>
      )}
    </div>
  );
}
