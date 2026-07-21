import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Scene } from "@/components/scene";
import { AppIcon } from "@/components/app-icon";

export const Route = createFileRoute("/admin/wellness")({
  component: () => <Protected mode="admin" staffOnly><Wellness /></Protected>,
});

type Score = { user_id: string; score_date: string; composite: number; focus_score: number; rest_score: number; reflection_score: number; connection_score: number; risk_band: string };

function Wellness() {
  const { data: scores = [] } = useQuery({
    queryKey: ["admin-wellness-scores"],
    queryFn: async () => {
      const { data } = await supabase.from("wellness_scores").select("user_id, score_date, composite, focus_score, rest_score, reflection_score, connection_score, risk_band").order("score_date", { ascending: true }).limit(2000);
      return (data ?? []) as Score[];
    },
  });

  // Trend: average composite by date
  const byDate = new Map<string, { sum: number; n: number }>();
  for (const s of scores) {
    const cur = byDate.get(s.score_date) ?? { sum: 0, n: 0 };
    cur.sum += Number(s.composite); cur.n += 1;
    byDate.set(s.score_date, cur);
  }
  const trend = Array.from(byDate.entries()).map(([d, v]) => ({ d, avg: v.sum / v.n }));

  // Distribution: latest per student
  const latest = new Map<string, Score>();
  for (const s of scores) {
    const prev = latest.get(s.user_id);
    if (!prev || prev.score_date < s.score_date) latest.set(s.user_id, s);
  }
  const bands = { green: 0, amber: 0, watch: 0 } as Record<string, number>;
  for (const s of latest.values()) bands[s.risk_band] = (bands[s.risk_band] ?? 0) + 1;
  const total = Math.max(1, latest.size);

  const maxAvg = Math.max(1, ...trend.map((t) => t.avg));
  const minAvg = Math.min(...trend.map((t) => t.avg), 0);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><AppIcon name="chart" size={14} /> Admin · Wellness</div>
          <h1 className="mt-1 font-display text-3xl">Cohort improvement</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-lg">A glanceable view of how the cohort is trending. No raw journal entries — even here.</p>
        </div>
        <Scene kind="ambient" size={96} />
      </header>

      <section className="soft-card p-6">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-sm font-medium">Average wellness composite over time</h2>
          <div className="text-xs text-muted-foreground">{trend.length} days</div>
        </div>
        <svg viewBox="0 0 600 160" className="w-full h-40">
          {trend.length > 1 && (
            <polyline
              fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
              points={trend.map((t, i) => {
                const x = (i / (trend.length - 1)) * 580 + 10;
                const y = 150 - ((t.avg - minAvg) / (maxAvg - minAvg || 1)) * 130;
                return `${x},${y}`;
              }).join(" ")}
            />
          )}
        </svg>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {(["green", "amber", "watch"] as const).map((b) => {
          const n = bands[b] ?? 0;
          const pct = Math.round((n / total) * 100);
          return (
            <div key={b} className="soft-card p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{b}</div>
              <div className="mt-2 font-display text-3xl tabular-nums">{n}</div>
              <div className="mt-1 text-xs text-muted-foreground">{pct}% of cohort</div>
              <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary/70" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="soft-card p-6">
        <h2 className="text-sm font-medium mb-4">Burnout scatter — engagement vs wellness</h2>
        <svg viewBox="0 0 600 240" className="w-full h-56">
          <line x1="10" y1="220" x2="590" y2="220" stroke="hsl(var(--border))" />
          <line x1="10" y1="10" x2="10" y2="220" stroke="hsl(var(--border))" />
          {Array.from(latest.values()).map((s, i) => (
            <circle key={i}
              cx={10 + (Number(s.focus_score) / 100) * 570}
              cy={220 - (Number(s.composite) / 100) * 200}
              r="5" fill={s.risk_band === "watch" ? "hsl(var(--dusk))" : s.risk_band === "amber" ? "hsl(var(--apricot))" : "hsl(var(--sage))"}
              opacity="0.75"
            />
          ))}
        </svg>
        <div className="mt-2 text-xs text-muted-foreground">Top-left quadrant is the worry zone: high effort, low wellness.</div>
      </section>
    </div>
  );
}
