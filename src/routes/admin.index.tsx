import { createFileRoute } from "@tanstack/react-router";
import { AppIcon } from "@/components/app-icon";
export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><AppIcon name="dashboard" size={14} /> Overview</div>
        <h1 className="text-3xl font-semibold">Cohort wellness</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Green",  hint: "In a healthy range" },
          { label: "Amber",  hint: "Gently needs attention" },
          { label: "Watch",  hint: "Priority — check in" },
        ].map((s) => (
          <div key={s.label} className="soft-card p-6">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="mt-2 text-4xl font-semibold">—</div>
            <div className="mt-1 text-xs text-muted-foreground">{s.hint}</div>
          </div>
        ))}
      </div>
      <div className="soft-card p-6">
        <h2 className="text-lg font-semibold">Burnout Scatter</h2>
        <p className="mt-2 text-sm text-muted-foreground">Engagement × wellness. Built in Phase 5.</p>
        <div className="mt-4 grid h-56 place-items-center rounded-lg bg-muted/50 text-xs text-muted-foreground">Coming in Phase 5</div>
      </div>
    </div>
  );
}
