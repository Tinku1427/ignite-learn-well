import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export type StaffNavItem = { to: string; label: string; icon?: React.ComponentType<{ className?: string }>; exact?: boolean };

function isActive(pathname: string, to: string, exact?: boolean) {
  return exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");
}

export function StaffShell({
  subtitle, nav, children,
}: { title?: string; subtitle: string; nav: StaffNavItem[]; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/portals" }); };

  const links = (
    <nav className="flex-1 space-y-1 px-3">
      {nav.map((n) => {
        const active = isActive(pathname, n.to, n.exact);
        const Icon = n.icon;
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => setOpen(false)}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-200",
              active
                ? "bg-secondary text-secondary-foreground font-medium"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
            )}
          >
            <span className={cn("h-5 w-0.5 rounded-full transition-all duration-200", active ? "bg-primary" : "bg-transparent")} />
            {Icon && <Icon className="size-4 shrink-0" />}
            <span className="truncate">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <div className="px-5 py-6">
      <BrandLogo height={34} />
      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{subtitle}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      {/* Desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        {brand}
        {links}
        <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground">
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>

      {/* Mobile bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/85 px-4 py-3 backdrop-blur md:hidden">
        <BrandLogo height={22} />
        <button aria-label="Menu" onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary/60">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </header>
      {open && (
        <div className="fixed inset-x-0 top-[57px] z-30 border-b border-border bg-background py-3 shadow-lg md:hidden page-fade">
          {links}
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-3 px-6 py-2.5 text-sm text-muted-foreground">
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}

      <main className="min-w-0 flex-1 px-5 py-7 md:px-10 md:py-10">
        <div className="mx-auto w-full max-w-6xl page-fade">{children}</div>
      </main>
    </div>
  );
}
