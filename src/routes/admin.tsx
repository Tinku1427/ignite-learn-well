import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
export const Route = createFileRoute("/admin")({
  component: () => <Protected mode="admin" staffOnly><Outlet /></Protected>,
});
