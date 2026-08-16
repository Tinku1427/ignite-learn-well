import { createFileRoute, Link } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { WellnessRing } from "@/components/wellness-ring";
import { Scene } from "@/components/scene";
import { AppIcon } from "@/components/app-icon";
import { useAuth } from "@/hooks/use-auth";
import { NudgeCard } from "@/components/nudge-card";
import { MessagesCard } from "@/components/messages-card";

export const Route = createFileRoute("/home")({ component: () => <Protected><Home /></Protected> });

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Late night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Late night";
}

import meditationImg from "@/assets/menu/yoga.png.asset.json";
import breakImg from "@/assets/menu/take-a-break.png.asset.json";
import calendarImg from "@/assets/menu/project.png.asset.json";
import breatheImg from "@/assets/menu/yoga_1.png.asset.json";
import privacyImg from "@/assets/menu/privacy.png.asset.json";
import welcomeImg from "@/assets/menu/introduction-handshake-2.png.asset.json";
import heroMeditating from "@/assets/menu/meditation-amico.png.asset.json";

const MENU = [
  { title: "Welcome",    img: welcomeImg.url,    to: "/me",                note: "Your space" },
  { title: "Meditation", img: meditationImg.url, to: "/practice/meditate", note: "Guided sits" },
  { title: "Breathing",  img: breatheImg.url,    to: "/practice/breathe",  note: "Calm in a minute" },
  { title: "Tea break",  img: breakImg.url,      to: "/focus",             note: "Rest a moment" },
  { title: "Calendar",   img: calendarImg.url,   to: "/plan",              note: "Plan your day" },
  { title: "Private",    img: privacyImg.url,    to: "/practice/journal",  note: "Your journal" },
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

      <NudgeCard />

      <MessagesCard />

      <section className="soft-card p-6 md:p-8 flex flex-col items-center gap-3">
        <WellnessRing arcs={arcs} />
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          One arc at a time. Small today. Different by month's end.
        </p>
      </section>

      <section className="grid place-items-center">
        <div className="relative grid place-items-center rounded-full bg-sage-soft/60 p-6" style={{ width: 260, height: 260 }}>
          <img src={heroMeditating.url} alt="" aria-hidden="true" className="h-[210px] w-[210px] object-contain" />
        </div>
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
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground"><AppIcon name="mentor" size={16} /> Main menu</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {MENU.map((c) => (
            <Link key={c.title} to={c.to} className="soft-card flex flex-col items-center gap-2 p-4 text-center transition-transform hover:-translate-y-0.5">
              <img src={c.img} alt="" aria-hidden="true" className="h-14 w-14 object-contain" />
              <div className="text-sm font-medium">{c.title}</div>
              <div className="text-[11px] text-muted-foreground">{c.note}</div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}
