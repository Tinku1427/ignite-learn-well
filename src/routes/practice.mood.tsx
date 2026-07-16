import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/practice/mood")({ component: () => (
  <div className="soft-card p-8 text-center">
    <div className="text-xs uppercase tracking-widest text-muted-foreground">Coming in Phase 2</div>
    <h2 className="mt-2 font-display text-2xl">Mood</h2>
    <p className="mt-3 text-sm text-muted-foreground">A quick check-in — no wrong answer.</p>
  </div>
)});
