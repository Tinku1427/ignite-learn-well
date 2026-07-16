import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
export const Route = createFileRoute("/learn")({ component: () => (
  <Protected>
    <header className="mb-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Learn</div>
      <h1 className="font-display text-3xl">Live sessions & recordings</h1>
    </header>
    <div className="soft-card p-8 text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Coming in Phase 3</div>
      <p className="mt-3 text-sm text-muted-foreground">Zoom links, recordings after live, and your to-dos.</p>
    </div>
  </Protected>
)});
