import { createFileRoute } from "@tanstack/react-router";
import { StaffLogin } from "@/components/staff-login";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Guiding Mentor" },
      { name: "description", content: "Sign in to the Guiding Mentor admin portal to manage cohorts, content, people and wellness analytics." },
      { property: "og:title", content: "Admin Portal — Guiding Mentor" },
      { property: "og:description", content: "Manage cohorts, content, people and wellness analytics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <StaffLogin
      role={["admin", "counsellor"]}
      kicker="Institute access"
      title="Admin portal"
      blurb="Cohort wellness, content, people and reports."
    />
  ),
});
