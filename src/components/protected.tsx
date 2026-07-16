import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { StudentShell } from "./student-shell";
import { AdminShell } from "./admin-shell";
import { supabase } from "@/integrations/supabase/client";

export function Protected({
  children,
  mode = "student",
  staffOnly = false,
}: { children: ReactNode; mode?: "student" | "admin"; staffOnly?: boolean }) {
  const { user, loading, isStaff } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: mode === "admin" ? "/admin-login" : "/auth" });
  }, [loading, user, router, mode]);

  useEffect(() => {
    if (!loading && user && staffOnly && !isStaff) {
      supabase.auth.signOut().then(() => router.navigate({ to: "/admin-login" }));
    }
  }, [loading, user, staffOnly, isStaff, router]);

  useEffect(() => {
    if (!loading && user && mode === "student") {
      // send unonboarded users to onboarding
      supabase.from("profiles").select("onboarding_complete").eq("id", user.id).maybeSingle().then(({ data }) => {
        if (data && !data.onboarding_complete && window.location.pathname !== "/onboarding") {
          router.navigate({ to: "/onboarding" });
        }
      });
    }
  }, [loading, user, mode, router]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>;
  }
  if (staffOnly && !isStaff) return null;

  return mode === "admin"
    ? <AdminShell>{children}</AdminShell>
    : <StudentShell>{children}</StudentShell>;
}
