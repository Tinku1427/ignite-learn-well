import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppIcon } from "@/components/app-icon";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

type Score = {
  user_id: string; score_date: string; composite: number;
  focus_score: number; risk_band: string; reasons: string[] | null;
};

function AdminOverview() {
  const { data: scores = [] } = useQuery({
    queryKey: ["admin-overview-scores"],
    queryFn: async () => {
      const { data } = await supabase.from("wellness_scores")
        .select("user_id,score_date,composite,focus_score,risk_band,reasons")
        .order("score_date", { ascending: false })
        .limit(2000);
      return (data ?? []) as Score[];
    },
  });

  const latest = new Map<string, Score>();
  for (const s of scores) if (!latest.has(s.user_id)) latest.set(s.user_id, s);
  const rows = Array.from(latest.values());

  const bands = { green: 0, amber: 0, watch: 0 } as Record<string, number>;
  for (const s of rows) bands[s.risk_band] = (bands[s.risk_band] ?? 0) + 1;
  const total = Math.max(1, rows.length);

  const attention = [...rows]
    .filter((r) => r.risk_band !== "green")
    .sort((a, b) => (a.risk_band === "watch" ? -1 : 1) - (b.risk_band === "watch" ? -1 : 1) || a.composite - b.composite)
    .slice(0, 8);

  const { data: profiles = [] } = useQuery({
    enabled: attention.length > 0,
    queryKey: ["admin-overview-profiles", attention.map((a) => a.user_id).join(",")],
    queryFn: async () => {
      const ids = attention.map((a) => a.user_id);
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return data ?? [];
    },
  });
  const nameOf = new Map(profiles.map((p: any) => [p.id, p.full_name as string | null]));

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><AppIcon name="dashboard" size={14} /> Overview</div>
        <h1 className="font-display text-3xl">Cohort wellness</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">A calm read of the whole cohort. No names in red — this is a companion, not a scoreboard.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {(["green", "amber", "watch"] as const).map((b) => {
          const n = bands[b] ?? 0;
          const pct = Math.round((n / total) * 100);
          return (
            <div key={b} className="soft-card p-6">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{b}</div>
              <div className="mt-2 font-display text-4xl tabular-nums">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground">{pct}% of cohort</div>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <section className="soft-card p-6">
        <h2 className="text-lg font-semibold">Needs attention</h2>
        <p className="text-xs text-muted-foreground">Amber & watch, coldest first.</p>
        <ul className="mt-3 space-y-2">
          {attention.map((r) => (
            <li key={r.user_id} className="rounded-xl border border-border bg-paper/40 p-3 flex items-center justify-between">
              <div>
                <Link to="/admin/students" className="font-medium hover:underline">{nameOf.get(r.user_id) ?? "Student"}</Link>
                <div className="text-[11px] text-muted-foreground">
                  {(r.reasons ?? []).slice(0, 2).join(" · ") || "Low composite this week"}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl tabular-nums">{Math.round(r.composite)}</span>
                <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-secondary">{r.risk_band}</span>
              </div>
            </li>
          ))}
          {attention.length === 0 && <div className="text-sm text-muted-foreground">Everyone is in a healthy range today.</div>}
        </ul>
      </section>

      <section className="soft-card p-6">
        <h2 className="text-lg font-semibold">Burnout Scatter</h2>
        <p className="text-xs text-muted-foreground">Focus effort × overall wellness. Top-left is the worry zone.</p>
        <svg viewBox="0 0 600 240" className="mt-4 w-full h-56">
          <line x1="10" y1="220" x2="590" y2="220" stroke="hsl(var(--border))" />
          <line x1="10" y1="10" x2="10" y2="220" stroke="hsl(var(--border))" />
          {rows.map((s, i) => (
            <circle key={i}
              cx={10 + (Number(s.focus_score) / 100) * 570}
              cy={220 - (Number(s.composite) / 100) * 200}
              r="5"
              fill={s.risk_band === "watch" ? "hsl(var(--dusk))" : s.risk_band === "amber" ? "hsl(var(--apricot))" : "hsl(var(--sage))"}
              opacity="0.8"
            />
          ))}
        </svg>
        <div className="mt-2 text-[11px] text-muted-foreground">x = focus effort · y = wellness composite</div>
      </section>
    </div>
  );
}
