import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/practice/meditate", label: "Meditate" },
  { to: "/practice/affirm",   label: "Affirm" },
  { to: "/practice/journal",  label: "Journal" },
  { to: "/practice/mood",     label: "Mood" },
  { to: "/practice/breathe",  label: "Breathe" },
] as const;

export const Route = createFileRoute("/practice")({
  component: () => (
    <Protected>
      <div className="space-y-6">
        <header>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Practice</div>
          <h1 className="font-display text-3xl">The core loop</h1>
        </header>
        <PracticeTabs />
        <Outlet />
      </div>
    </Protected>
  ),
});

function PracticeTabs() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2">
        {TABS.map((t) => {
          const active = path === t.to;
          return (
            <li key={t.to}>
              <Link to={t.to} className={cn(
                "inline-block rounded-full px-4 py-1.5 text-sm",
                active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
              )}>{t.label}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
