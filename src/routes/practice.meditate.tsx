import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/practice/meditate")({ component: () => <Placeholder title="Meditate" /> });

function Placeholder({ title }: { title: string }) {
  return (
    <div className="soft-card p-8 text-center">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Coming in Phase 2</div>
      <h2 className="mt-2 font-display text-2xl">{title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">Coach-recorded guided practices land here next.</p>
    </div>
  );
}
