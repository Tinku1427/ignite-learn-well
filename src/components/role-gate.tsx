import { useEffect, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";

/** Gate a page to a specific role. Sends unauthorised users to the portal chooser. */
export function RoleGate({ role, children }: { role: AppRole | AppRole[]; children: ReactNode }) {
  const { user, roles, loading } = useAuth();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (loading) return;
    if (!user) { router.navigate({ to: "/portals" }); return; }
    if (!roles.some((r) => allowed.includes(r))) router.navigate({ to: "/portals" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, roles, router]);

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground text-sm">…</div>;
  const ok = roles.some((r) => allowed.includes(r));
  if (!ok) return null;
  return <>{children}</>;
}

