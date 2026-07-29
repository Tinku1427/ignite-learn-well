import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";


export const Route = createFileRoute("/portals")({
  head: () => ({
    meta: [
      { title: "Choose your portal — Guiding Mentor" },
      { name: "description", content: "Pick your Guiding Mentor sign-in portal: student, mentor, coach or admin." },
      { property: "og:title", content: "Choose your portal — Guiding Mentor" },
      { property: "og:description", content: "Student, mentor, coach and admin sign-in for Guiding Mentor." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Portals,
});

const PORTALS = [
  { to: "/auth", label: "Student", note: "Practice, focus, journal and your wellness ring." },
  { to: "/mentor-login", label: "Mentor", note: "Your booked students and their trends." },
  { to: "/coach-login", label: "Coach", note: "Your assigned caseload, risk-ranked." },
  { to: "/admin-login", label: "Admin", note: "Institute-wide analytics, content and people." },
] as const;

function Portals() {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="flex justify-center"><BrandLogo height={34} /></Link>
          <h1 className="mt-3 font-display text-2xl">Choose your portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Each role has its own sign-in.</p>
        </div>
        <div className="soft-card space-y-2 p-4">
          {PORTALS.map((p) => (
            <Link
              key={p.to}
              to={p.to}
              className="block rounded-xl border border-border bg-paper/40 px-4 py-3 hover:bg-secondary/60"
            >
              <div className="font-medium">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.note}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
