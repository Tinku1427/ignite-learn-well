import type { NavigateOptions } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "admin" | "mentor" | "counsellor" | "coach";

export const ROLE_HOME: Record<AppRole, string> = {
  admin: "/admin",
  counsellor: "/admin",
  coach: "/coach",
  mentor: "/mentor",
  student: "/home",
};

const STAFF: AppRole[] = ["admin", "counsellor", "coach", "mentor"];

/** Roles ranked by priority for auto-redirect. Students come last. */
const PRIORITY: AppRole[] = ["admin", "counsellor", "coach", "mentor", "student"];

export function pickPrimaryRole(roles: AppRole[]): AppRole | null {
  for (const r of PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export async function fetchRoles(userId: string): Promise<AppRole[]> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r) => r.role as AppRole);
}

export function landingForRoles(roles: AppRole[]): string {
  const staff = roles.filter((r) => STAFF.includes(r));
  if (staff.length > 1) return "/role-select";
  const primary = pickPrimaryRole(roles);
  return primary ? ROLE_HOME[primary] : "/home";
}

export async function navigateByRole(
  userId: string,
  navigate: (opts: NavigateOptions) => void,
) {
  const roles = await fetchRoles(userId);
  const to = landingForRoles(roles);
  navigate({ to } as NavigateOptions);
}
