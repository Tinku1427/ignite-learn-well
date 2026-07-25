import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/reports")({
  component: () => <Protected mode="admin" staffOnly><Reports /></Protected>,
});

function Reports() {
  const { data: scores = [] } = useQuery({
    queryKey: ["admin-reports-scores"],
    queryFn: async () => (await supabase.from("wellness_scores").select("score_date, composite, focus_score, rest_score, reflection_score, connection_score").order("score_date")).data ?? [],
  });

  const byDate = new Map<string, { sum: number; n: number; focus: number; rest: number; refl: number; conn: number }>();
  for (const s of scores as any[]) {
    const cur = byDate.get(s.score_date) ?? { sum: 0, n: 0, focus: 0, rest: 0, refl: 0, conn: 0 };
    cur.sum += Number(s.composite); cur.n += 1;
    cur.focus += Number(s.focus_score); cur.rest += Number(s.rest_score);
    cur.refl += Number(s.reflection_score); cur.conn += Number(s.connection_score);
    byDate.set(s.score_date, cur);
  }
  const rows = Array.from(byDate.entries()).map(([d, v]) => ({
    d, avg: v.sum / v.n, focus: v.focus / v.n, rest: v.rest / v.n, refl: v.refl / v.n, conn: v.conn / v.n,
  }));
  const first = rows[0], last = rows[rows.length - 1];

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin · Reports</div>
        <h1 className="font-display text-3xl">Improvement report</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">Before → now, across four dimensions.</p>
      </header>

      {first && last ? (
        <div className="grid gap-3 md:grid-cols-4">
          {([
            ["Focus","focus"],["Rest","rest"],["Reflection","refl"],["Connection","conn"],
          ] as const).map(([label, key]) => {
            const dir = last[key] - first[key];
            return (
              <div key={key} className="soft-card p-5">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
                <div className="mt-2 font-display text-3xl tabular-nums">{Math.round(last[key])}</div>
                <div className="mt-1 text-xs">from {Math.round(first[key])} · <span className={dir >= 0 ? "text-sage-ink" : "text-muted-foreground"}>{dir >= 0 ? "+" : ""}{Math.round(dir)}</span></div>
              </div>
            );
          })}
        </div>
      ) : <div className="soft-card p-6 text-sm text-muted-foreground">Not enough data yet.</div>}

      <section className="soft-card p-6">
        <h2 className="text-sm font-medium mb-3">Cohort composite trend</h2>
        <svg viewBox="0 0 600 160" className="w-full h-40">
          {rows.length > 1 && (
            <polyline fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5"
              points={rows.map((r, i) => `${(i / (rows.length - 1)) * 580 + 10},${150 - (r.avg / 100) * 130}`).join(" ")}
            />
          )}
        </svg>
      </section>
    </div>
  );
}
