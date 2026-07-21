import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { WellnessRing } from "@/components/wellness-ring";
import { Scene } from "@/components/scene";
import { AppIcon } from "@/components/app-icon";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/home")({ component: () => <Protected><Home /></Protected> });

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night";
}

const CONCERNS = [
  { title: "Stressed",       to: "/practice/breathe",   note: "A minute of breathing" },
  { title: "Can't focus",    to: "/focus",              note: "Try a 25-minute pomodoro" },
  { title: "Sleep trouble",  to: "/practice/meditate",  note: "Evening wind-down" },
  { title: "Feeling low",    to: "/practice/journal",   note: "Put it on the page" },
  { title: "Need to talk",   to: "/me",                 note: "See your mentors" },
] as const;

function Home() {
  const { user } = useAuth();
  const first = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "friend";
  const arcs = { focus: 62, rest: 58, reflection: 70, connection: 45 };
  const isMorning = new Date().getHours() < 15;

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{greeting()}</div>
        <h1 className="font-display text-3xl md:text-4xl">{greeting()}, {first}.</h1>
      </header>

      <section className="soft-card p-6 md:p-8 flex flex-col items-center gap-3">
        <WellnessRing arcs={arcs} />
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          One arc at a time. Small today. Different by month's end.
        </p>
      </section>

      <section className="grid place-items-center">
        <Scene kind={isMorning ? "home-morning" : "home-evening"} size={200} />
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><AppIcon name="checklist" size={16} /> Today's practice</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { t: "Morning meditation", d: "5 min · guided", to: "/practice/meditate" },
            { t: "One affirmation",    d: "Read or speak",  to: "/practice/affirm" },
            { t: "Journal entry",      d: "3 lines is enough", to: "/practice/journal" },
            { t: "Evening meditation", d: "5 min · wind-down", to: "/practice/meditate" },
          ].map((c) => (
            <Link key={c.t} to={c.to} className="soft-card p-4 hover:bg-secondary/40 transition-colors">
              <div className="font-medium">{c.t}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{c.d}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">What's on your mind?</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CONCERNS.map((c) => (
            <Link key={c.title} to={c.to} className="rounded-2xl bg-secondary p-4 text-left transition-transform hover:-translate-y-0.5">
              <div className="text-sm font-medium">{c.title}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">{c.note}</div>
            </Link>
          ))}
        </div>
      </section>

      <p className="pt-4 text-center text-[11px] text-muted-foreground">
        Need to talk to someone right now? <a href="tel:14416" className="underline">Tele-MANAS 14416</a> · <a href="tel:18005990019" className="underline">Kiran 1800-599-0019</a>
      </p>
    </div>
  );
}
