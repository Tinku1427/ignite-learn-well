import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "./app-shell";

export function Protected({
  children,
  mode = "student",
  adminOnly = false,
}: {
  children: ReactNode;
  mode?: "student" | "admin";
  adminOnly?: boolean;
}) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.navigate({ to: "/auth" });
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && adminOnly && !isAdmin) router.navigate({ to: "/dashboard" });
  }, [loading, user, adminOnly, isAdmin, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (adminOnly && !isAdmin) return null;

  return <AppShell mode={mode}>{children}</AppShell>;
}
