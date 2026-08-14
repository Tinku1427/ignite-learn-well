import { MessagesCard } from "@/components/messages-card";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleGate } from "@/components/role-gate";
import { StaffShell } from "@/components/staff-shell";
import { Scene } from "@/components/scene";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/coach")({
  component: () => (
    <RoleGate role={["coach", "counsellor"]}>
      <StaffShell title="Guiding Mentor" subtitle="Coach" nav={[
        { to: "/coach", label: "Students needing check-in" },
      ]}>
        <CoachHome />
      </StaffShell>
    </RoleGate>
  ),
});

type Row = {
  user_id: string;
  full_name: string | null;
  composite: number;
  risk_band: string;
  score_date: string;
};

const bandTone = (b: string) =>
  b === "green" ? "bg-sage-soft text-foreground"
  : b === "amber" ? "bg-apricot/40 text-foreground"
  : "bg-dusk/20 text-foreground";

function CoachHome() {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["coach-attention"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wellness_scores")
        .select("user_id, composite, risk_band, score_date")
        .order("score_date", { ascending: false })
        .limit(500);
      if (error) throw error;
      const seen = new Set<string>();
      const latest: Omit<Row, "full_name">[] = [];
      for (const r of data ?? []) {
        if (seen.has(r.user_id)) continue;
        seen.add(r.user_id);
        latest.push(r);
      }
      const ids = latest.map((r) => r.user_id);
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id, full_name").in("id", ids)
        : { data: [] as { id: string; full_name: string | null }[] };
      const nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      const withNames: Row[] = latest.map((r) => ({ ...r, full_name: nameMap.get(r.user_id) ?? null }));
      const order: Record<string, number> = { watch: 0, amber: 1, green: 2 };
      withNames.sort((a, b) => (order[a.risk_band] ?? 3) - (order[b.risk_band] ?? 3) || a.composite - b.composite);
      return withNames;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["coach-events"],
    queryFn: async () => {
      const { data } = await supabase.from("agent_events").select("id,user_id,event_type,detail,created_at").order("created_at", { ascending: false }).limit(20);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Coach</div>
          <h1 className="mt-1 font-display text-3xl">Who needs a check-in today</h1>
          <p className="mt-1 text-muted-foreground text-sm max-w-lg">Lead with the signal. Reach out early — you have wellness scores and agent flags, but not the diary.</p>
        </div>
        <Scene kind="ambient" size={96} />
      </header>

      <MessagesCard title="From the admin" />

      {(() => {
        const flags = events.filter((e) => e.event_type === "crisis_flag");
        if (!flags.length) return null;
        const nameOf = (id: string) => rows.find((r) => r.user_id === id)?.full_name ?? "A student";
        return (
          <section className="soft-card border-primary/30 bg-secondary/60 p-5">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Reach out first</div>
            <h2 className="mt-1 font-display text-xl">Safety signal detected</h2>
            <p className="mt-1 max-w-prose text-sm text-muted-foreground">
              Language suggesting self-harm appeared in a check-in. The words stay private — call them today.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {flags.slice(0, 8).map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-2">
                  <span className="font-medium">{nameOf(f.user_id)}</span>
                  <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })()}

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Ranked by risk</h2>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.user_id} className="soft-card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{r.full_name ?? "Student"}</div>
                <div className="text-xs text-muted-foreground">Last score {r.score_date}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-display tabular-nums">{Math.round(r.composite)}</span>
                <span className={cn("text-xs px-2 py-1 rounded-full uppercase tracking-widest", bandTone(r.risk_band))}>{r.risk_band}</span>
              </div>
            </li>
          ))}
          {!isLoading && rows.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No wellness scores yet.</div>}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Recent agent events</h2>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id as string} className="soft-card p-3 text-sm flex justify-between">
              <span className="font-medium">{e.event_type as string}</span>
              <span className="text-muted-foreground text-xs">{new Date(e.created_at as string).toLocaleString()}</span>
            </li>
          ))}
          {events.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No events yet.</div>}
        </ul>
      </section>
    </div>
  );
}
