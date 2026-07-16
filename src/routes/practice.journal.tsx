import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/practice/journal")({ component: () => (
  <div className="soft-card p-8 text-center">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">Coming in Phase 2</div>
    <h2 className="mt-2 font-display text-2xl">Journal</h2>
    <p className="mt-3 text-sm text-muted-foreground">Private by default. Yours alone unless you tap "share with mentor".</p>
  </div>
)});
