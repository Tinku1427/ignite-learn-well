import { createFileRoute, Navigate } from "@tanstack/react-router";
export const Route = createFileRoute("/practice/")({ component: () => <Navigate to="/practice/meditate" /> });
