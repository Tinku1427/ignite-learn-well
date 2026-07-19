import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

/** Gate a page to a specific role. Signs out unauthorised users to /admin-login. */
export function RoleGate({ role, children }: { role: AppRole | AppRole[]; children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (loading) return;
    if (!user) { router.navigate({ to: "/admin-login" }); return; }
    const ok = roles.some((r) => allowed.includes(r));
    if (!ok) supabase.auth.signOut().then(() => router.navigate({ to: "/admin-login" }));
  }, [loading, user, roles, allowed, router]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>;
  const ok = roles.some((r) => allowed.includes(r));
  if (!ok) return null;
  return <>{children}</>;
}
