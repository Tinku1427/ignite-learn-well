import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  Home,
  BookOpen,
  ClipboardList,
  Timer,
  NotebookPen,
  Smile,
  Wind,
  ListChecks,
  BarChart3,
  Users,
  Settings,
  LogOut,
  Sparkles,
  ClipboardCheck,
  Megaphone,
  Bell,
  MessageCircle,
  Heart,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };

const studentNav: NavItem[] = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/focus", label: "Focus", icon: Timer },
  { to: "/journal", label: "Journal", icon: NotebookPen },
  { to: "/mood", label: "Mood", icon: Smile },
  { to: "/meditate", label: "Meditate", icon: Wind },
  { to: "/todo", label: "To-do", icon: ListChecks },
  { to: "/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/mentors", label: "Mentors", icon: MessageCircle },
  { to: "/progress", label: "Progress", icon: BarChart3 },
  { to: "/support", label: "Support", icon: Heart },
];

const adminNav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: Home },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/classes", label: "Classes", icon: BookOpen },
  { to: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/admin/meditations", label: "Meditations", icon: Wind },
  { to: "/admin/assessments", label: "Assessments", icon: ClipboardCheck },
  { to: "/admin/mentors", label: "Mentors", icon: MessageCircle },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { to: "/admin/reminders", label: "Reminders", icon: Bell },
];

export function AppShell({ children, mode = "student" }: { children: ReactNode; mode?: "student" | "admin" }) {
  const nav = mode === "admin" ? adminNav : studentNav;
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const { user, isAdmin } = useAuth();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-sidebar text-sidebar-foreground">
        <div className="p-5 flex items-center gap-2 border-b">
          <div className="size-9 rounded-xl gradient-calm grid place-items-center text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="font-display font-semibold leading-tight">Guiding Mentor</div>
            <div className="text-xs text-muted-foreground">{mode === "admin" ? "Admin" : "Student"}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                  active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/60"
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t space-y-1">
          {isAdmin && (
            <Link
              to={mode === "admin" ? "/dashboard" : "/admin"}
              className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent/60"
            >
              <Settings className="size-4" />
              {mode === "admin" ? "Student view" : "Admin panel"}
            </Link>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-sidebar-accent/60 text-left"
          >
            <LogOut className="size-4" />
            Sign out
          </button>
          {user?.email && <div className="text-xs text-muted-foreground px-3 pt-2 truncate">{user.email}</div>}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden sticky top-0 z-30 border-b bg-background/80 backdrop-blur px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="size-8 rounded-lg gradient-calm grid place-items-center text-primary-foreground">
              <Sparkles className="size-4" />
            </div>
            <span className="font-display font-semibold">Guiding Mentor</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-6xl w-full mx-auto">{children}</main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t">
          <div className="grid grid-cols-5">
            {nav.slice(0, 5).map((item) => {
              const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center justify-center py-2 text-[10px] gap-1",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="size-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
