import { LayoutDashboard, Users, FileText, BookOpen, Bot, Megaphone, Activity, UserCog } from "lucide-react";
import type { ReactNode } from "react";
import { StaffShell, type StaffNavItem } from "@/components/staff-shell";

const NAV: StaffNavItem[] = [
  { to: "/admin",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { to: "/admin/wellness",      label: "Improvement",   icon: Activity },
  { to: "/admin/students",      label: "Students",      icon: Users },
  { to: "/admin/people",        label: "People",        icon: UserCog },
  { to: "/admin/reports",       label: "Reports",       icon: FileText },
  { to: "/admin/content",       label: "Content",       icon: BookOpen },
  { to: "/admin/agent",         label: "Agent",         icon: Bot },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

export function AdminShell({ children }: { children: ReactNode }) {
  return <StaffShell subtitle="Admin" nav={NAV}>{children}</StaffShell>;
}
