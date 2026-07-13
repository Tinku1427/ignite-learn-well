import { Link } from "@tanstack/react-router";
import { BookOpen, Wind, Moon, Sparkles, MessageCircle, Heart } from "lucide-react";
import { Mascot } from "@/components/mascot";

type Concern = {
  key: string;
  title: string;
  blurb: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
};

const CONCERNS: Concern[] = [
  {
    key: "exams",
    title: "Stressed about exams",
    blurb: "Breathe, reset, then ease back in.",
    to: "/meditate",
    icon: Wind,
    bg: "from-[oklch(0.9_0.06_200)] to-[oklch(0.82_0.09_180)]",
  },
  {
    key: "focus",
    title: "Can't focus",
    blurb: "Start a short focus session.",
    to: "/focus",
    icon: BookOpen,
    bg: "from-[oklch(0.92_0.05_240)] to-[oklch(0.82_0.09_230)]",
  },
  {
    key: "sleep",
    title: "Sleep trouble",
    blurb: "Log last night + wind-down.",
    to: "/mood",
    icon: Moon,
    bg: "from-[oklch(0.88_0.05_280)] to-[oklch(0.78_0.09_270)]",
  },
  {
    key: "motivation",
    title: "Low motivation",
    blurb: "Stack one small win.",
    to: "/todo",
    icon: Sparkles,
    bg: "from-[oklch(0.92_0.08_60)] to-[oklch(0.83_0.12_40)]",
  },
  {
    key: "talk",
    title: "Need to talk to someone",
    blurb: "Book a mentor session.",
    to: "/mentors",
    icon: MessageCircle,
    bg: "from-[oklch(0.9_0.06_20)] to-[oklch(0.82_0.11_15)]",
  },
  {
    key: "low",
    title: "Feeling low or anxious",
    blurb: "A quick mood check-in helps.",
    to: "/mood",
    icon: Heart,
    bg: "from-[oklch(0.9_0.05_340)] to-[oklch(0.8_0.1_330)]",
  },
];

export function ConcernGrid() {
  return (
    <section aria-labelledby="concerns-heading" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="concerns-heading" className="font-display text-lg md:text-xl font-semibold">
            What's on your mind today?
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">
            Everyone has off days — that's what this is here for.
          </p>
        </div>
        <Mascot mood="encouraging" size={56} className="hidden sm:block" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {CONCERNS.map((c) => (
          <Link
            key={c.key}
            to={c.to}
            className={`group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br ${c.bg} text-foreground/80 border border-white/40 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all min-h-[112px] flex flex-col justify-between`}
          >
            <c.icon className="size-5 text-foreground/70" />
            <div>
              <div className="font-medium text-sm leading-tight">{c.title}</div>
              <div className="text-[11px] text-foreground/60 mt-0.5">{c.blurb}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
