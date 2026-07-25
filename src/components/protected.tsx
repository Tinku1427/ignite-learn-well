import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { StudentShell } from "./student-shell";
import { AdminShell } from "./admin-shell";
import { supabase } from "@/integrations/supabase/client";
import { ROLE_HOME, pickPrimaryRole } from "@/lib/role-routing";

export function Protected({
  children,
  mode = "student",
  staffOnly = false,
}: { children: ReactNode; mode?: "student" | "admin"; staffOnly?: boolean }) {
  const { user, loading, roles, isStaff, isAdmin } = useAuth();
  const router = useRouter();
  const [gateChecked, setGateChecked] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: mode === "admin" ? "/admin-login" : "/auth" });
  }, [loading, user, router, mode]);

  useEffect(() => {
    if (loading || !user) return;
    if (mode === "admin") {
      if (!isAdmin) router.navigate({ to: "/admin-login" });
      return;
    }
    // student mode — bounce staff-only users to their own panel
    if (staffOnly && !isStaff) {
      supabase.auth.signOut().then(() => router.navigate({ to: "/admin-login" }));
      return;
    }
    if (roles.length > 0 && !roles.includes("student")) {
      const primary = pickPrimaryRole(roles);
      if (primary && ROLE_HOME[primary] !== "/home") router.navigate({ to: ROLE_HOME[primary] as string });
    }
  }, [loading, user, mode, staffOnly, isStaff, isAdmin, roles, router]);

  useEffect(() => {
    if (loading || !user || mode !== "student") return;
    supabase
      .from("profiles")
      .select("onboarding_complete, parental_consent_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const path = window.location.pathname;
        const needsOnboarding = !data || !data.onboarding_complete || !data.parental_consent_at;
        if (needsOnboarding && path !== "/onboarding") {
          router.navigate({ to: "/onboarding" });
        } else {
          setGateChecked(true);
        }
      });
  }, [loading, user, mode, router]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>;
  }
  if (staffOnly && !isStaff) return null;
  if (mode === "student" && !gateChecked) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>;
  }

  return mode === "admin"
    ? <AdminShell>{children}</AdminShell>
    : <StudentShell>{children}</StudentShell>;
}
