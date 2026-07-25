import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ROLE_HOME, type AppRole } from "@/lib/role-routing";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/role-select")({ component: RoleSelect });

const LABEL: Record<AppRole, string> = {
  admin: "Admin",
  counsellor: "Counsellor",
  coach: "Coach",
  mentor: "Mentor",
  student: "Student",
};

function RoleSelect() {
  const { user, roles, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">…</div>;
  }

  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/auth" }); };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="font-display text-2xl">Continue as…</div>
          <p className="mt-1 text-sm text-muted-foreground">You hold more than one role.</p>
        </div>
        <div className="soft-card p-4 space-y-2">
          {roles.map((r) => (
            <Link
              key={r}
              to={ROLE_HOME[r] as string}
              className="flex items-center justify-between rounded-xl border border-border bg-paper/40 px-4 py-3 hover:bg-secondary/60"
            >
              <span className="font-medium">{LABEL[r]}</span>
              <span className="text-xs text-muted-foreground">Open {LABEL[r]} panel →</span>
            </Link>
          ))}
          {roles.length === 0 && (
            <div className="p-3 text-sm text-muted-foreground">
              No role assigned yet. Contact an admin.
            </div>
          )}
        </div>
        <button onClick={signOut} className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground">Sign out</button>
      </div>
    </div>
  );
}
