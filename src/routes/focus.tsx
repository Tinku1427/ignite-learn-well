import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
export const Route = createFileRoute("/focus")({ component: () => (
  <Protected>
    <header className="mb-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Focus</div>
      <h1 className="font-display text-3xl">A single session at a time</h1>
    </header>
    <div className="soft-card p-8 text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Coming in Phase 3</div>
      <p className="mt-3 text-sm text-muted-foreground">Pomodoro with a real, non-skippable break.</p>
    </div>
  </Protected>
)});
