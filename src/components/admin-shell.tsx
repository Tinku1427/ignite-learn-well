import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, FileText, BookOpen, Bot, Megaphone, Activity, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const NAV: NavItem[] = [
  { to: "/admin",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { to: "/admin/wellness",      label: "Wellness",      icon: Activity },
  { to: "/admin/students",      label: "Students",      icon: Users },
  { to: "/admin/reports",       label: "Reports",       icon: FileText },
  { to: "/admin/content",       label: "Content",       icon: BookOpen },
  { to: "/admin/agent",         label: "Agent",         icon: Bot },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/admin-login" }); };
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        <div className="px-5 py-6">
          <div className="font-display text-lg leading-none">Guiding Mentor</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Admin</div>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : (pathname === to || pathname.startsWith(to + "/"));
            return (
              <Link key={to} to={to} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}>
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <button onClick={signOut} className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60">
          <LogOut className="size-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-10 max-w-7xl mx-auto w-full page-fade">
        {children}
      </main>
    </div>
  );
}
