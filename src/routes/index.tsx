import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, BookOpen, Timer, Heart, Bell, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-xl gradient-calm grid place-items-center text-primary-foreground">
            <Sparkles className="size-5" />
          </div>
          <span className="font-display font-semibold text-lg">Guiding Mentor</span>
        </div>
        <nav className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
          <Link to="/auth"><Button>Get started</Button></Link>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-10 pb-20 md:pt-16 md:pb-28 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            <span className="size-2 rounded-full bg-success" /> Built for JEE & NEET aspirants
          </span>
          <h1 className="mt-5 text-4xl md:text-6xl font-display font-semibold leading-[1.05] tracking-tight">
            Study smart. <span className="text-primary">Stay well.</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-xl">
            Recorded classes, assignments, focused Pomodoro sessions, journaling, mood tracking and 1:1
            mentor support — everything you need for calm, consistent exam prep in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="gap-2">Start your journey <ArrowRight className="size-4" /></Button>
            </Link>
            <Link to="/auth"><Button size="lg" variant="outline">I already have an account</Button></Link>
          </div>
          <div className="mt-8 flex items-center gap-5 text-sm text-muted-foreground">
            <div><span className="text-foreground font-semibold">7-day</span> streaks</div>
            <div><span className="text-foreground font-semibold">1:1</span> counsellor support</div>
            <div><span className="text-foreground font-semibold">Daily</span> nudges</div>
          </div>
        </div>
        <div className="relative">
          <div className="soft-card p-6 md:p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: "Recorded classes", tone: "gradient-calm" },
                { icon: Timer, label: "Pomodoro focus", tone: "gradient-warm" },
                { icon: Heart, label: "Mood + journal", tone: "gradient-calm" },
                { icon: Bell, label: "Daily nudges", tone: "gradient-warm" },
                { icon: Users, label: "Mentor 1:1", tone: "gradient-calm" },
                { icon: Sparkles, label: "Streaks & badges", tone: "gradient-warm" },
              ].map((f) => (
                <div key={f.label} className="rounded-2xl p-4 bg-secondary/60">
                  <div className={`size-9 rounded-xl ${f.tone} grid place-items-center text-primary-foreground mb-3`}>
                    <f.icon className="size-4" />
                  </div>
                  <div className="text-sm font-medium">{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-muted-foreground flex flex-wrap justify-between gap-2">
          <div>© {new Date().getFullYear()} Guiding Mentor</div>
          <div>Made with care for JEE & NEET aspirants.</div>
        </div>
      </footer>
    </div>
  );
}
