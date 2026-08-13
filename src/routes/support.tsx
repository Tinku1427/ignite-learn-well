import { createFileRoute } from "@tanstack/react-router";
import { CrisisHelp } from "@/components/crisis-help";
import { Protected } from "@/components/protected";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Talk to someone now — Guiding Mentor" },
      { name: "description", content: "Free, confidential 24/7 mental health helplines for students in India: Tele-MANAS 14416 and KIRAN 1800-599-0019." },
      { property: "og:title", content: "Talk to someone now — Guiding Mentor" },
      { property: "og:description", content: "Free, confidential 24/7 mental health helplines for students in India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Protected><Support /></Protected>,
});

function Support() {
  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Support</div>
        <h1 className="mt-1 font-display text-3xl">You can reach a human</h1>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Guiding Mentor is a practice app, not a counsellor. When things feel too big for a breathing
          exercise, these people are trained for exactly this.
        </p>
      </header>
      <CrisisHelp tone="always" />
    </div>
  );
}
