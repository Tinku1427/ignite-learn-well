import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export type StaffNavItem = { to: string; label: string };

export function StaffShell({
  title, subtitle, nav, children,
}: { title: string; subtitle: string; nav: StaffNavItem[]; children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/admin-login" }); };
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-6">
          <div className="font-display text-lg leading-none">{title}</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">{subtitle}</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            return (
              <Link key={n.to} to={n.to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}>{n.label}</Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60">
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-10 max-w-7xl mx-auto w-full page-fade">{children}</main>
    </div>
  );
}
