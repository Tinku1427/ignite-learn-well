import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WellnessRing } from "@/components/wellness-ring";
import { Buddy } from "@/components/buddy";

export const Route = createFileRoute("/")({ component: Landing });

function Landing() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) router.navigate({ to: "/home" });
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session?.user) router.navigate({ to: "/home" }); });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="font-display text-lg">Guiding Mentor</div>
        <Link to="/auth" className="rounded-full border border-border bg-card px-4 py-2 text-sm hover:bg-secondary">Sign in</Link>
      </header>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-10 md:grid-cols-2 md:py-20">
        <div>
          <p className="text-sm font-medium text-primary">For NEET aspirants</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.1] md:text-6xl">
            We track the student, <em className="not-italic text-primary">not the syllabus.</em>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            A calm daily companion — guided meditations, journaling, focus, and a real transformation arc across your prep. No leaderboards. Ever.
          </p>
          <div className="mt-8 flex gap-3">
            <Link to="/auth" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground">Begin</Link>
            <a href="#how" className="rounded-full border border-border bg-card px-6 py-3 text-sm">How it works</a>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <WellnessRing arcs={{ focus: 70, rest: 65, reflection: 72, connection: 60 }} />
          <Buddy mood="encouraging" size={80} className="-mt-6" />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { t: "The core loop", d: "Morning meditation, an affirmation, a journal entry, evening meditation. Small daily practice — everything else supports these four." },
            { t: "A real arc", d: "A baseline at the start, checkpoints along the way, an outcome at the end. Your parent sees the arc — never the diary." },
            { t: "Notices you", d: "Buddy watches your week and sends one warm nudge when needed. If it senses real distress, it routes to a human, gently." },
          ].map((c) => (
            <div key={c.t} className="soft-card p-6">
              <h3 className="font-display text-xl">{c.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Guiding Mentor · A calmer way to prepare
      </footer>
    </div>
  );
}
