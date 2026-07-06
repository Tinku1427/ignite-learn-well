import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
export const Route = createFileRoute("/admin")({
  component: () => <Protected mode="admin" adminOnly><Outlet /></Protected>,
});
