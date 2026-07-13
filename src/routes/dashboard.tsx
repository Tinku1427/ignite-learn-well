import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, BookOpen, NotebookPen, ClipboardList, Smile, Wind, ListChecks, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Mascot, type MascotMood } from "@/components/mascot";
import { ConcernGrid } from "@/components/concern-grid";
import { StreakFlame } from "@/components/streak-flame";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Today — Guiding Mentor" }] }),
  component: () => <Protected><Dashboard /></Protected>,
});

const MOTIVATIONS = [
  "Small steps beat perfect plans. Start with five minutes.",
  "You've done hard things before. This is just today's version.",
  "Focus on the next tiny action. The rest sorts itself out.",
  "Rest is part of the work. Breathe first, then begin.",
  "Progress is quiet. Trust it even when you can't see it.",
];

function greetingFor(hour: number, moodScore?: number | null) {
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  if (moodScore != null && moodScore <= 2) {
    return { hello: `Good ${timeOfDay}`, line: "Rough day? Let's ease into it — no rush.", mood: "concerned" as MascotMood };
  }
  if (moodScore != null && moodScore >= 4) {
    return { hello: `Good ${timeOfDay}`, line: "Love that energy. Let's use it well.", mood: "celebrating" as MascotMood };
  }
  return { hello: `Good ${timeOfDay}`, line: "Here's your day at a glance — one thing at a time.", mood: "encouraging" as MascotMood };
}

function Dashboard() {
  const { user } = useAuth();
  const uid = user?.id;
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", uid!).maybeSingle()).data,
    enabled: !!uid,
  });

  const { data: stats } = useQuery({
    queryKey: ["today-stats", uid, today],
    queryFn: async () => {
      const startIso = new Date(today).toISOString();
      const [pomos, dueAssign, journal, mood] = await Promise.all([
        supabase.from("pomodoro_sessions").select("duration_min").eq("user_id", uid!).gte("completed_at", startIso),
        supabase.from("assignments").select("id").gte("due_at", startIso),
        supabase.from("journal_entries").select("id").eq("user_id", uid!).eq("entry_date", today).maybeSingle(),
        supabase.from("mood_logs").select("score").eq("user_id", uid!).eq("log_date", today).maybeSingle(),
      ]);
      const totalMin = (pomos.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
      return {
        totalMin,
        pomoCount: pomos.data?.length ?? 0,
        dueCount: dueAssign.data?.length ?? 0,
        journaled: !!journal.data,
        moodDone: !!mood.data,
        moodScore: mood.data?.score ?? null,
      };
    },
    enabled: !!uid,
  });

  const { data: streak } = useQuery({
    queryKey: ["streak", uid],
    queryFn: async () => {
      const { data } = await supabase.from("journal_entries").select("entry_date").eq("user_id", uid!).order("entry_date", { ascending: false }).limit(60);
      const set = new Set((data ?? []).map((r) => r.entry_date));
      let s = 0;
      const cur = new Date();
      while (set.has(format(cur, "yyyy-MM-dd"))) { s++; cur.setDate(cur.getDate() - 1); }
      return s;
    },
    enabled: !!uid,
  });

  const { data: announcements } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").eq("active", true).order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  const name = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const { hello, line, mood } = greetingFor(hour, stats?.moodScore);
  const motivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

  const statCards = [
    {
      label: "Study today",
      value: stats?.totalMin ? `${stats.totalMin} min` : "Ready when you are",
      hint: stats?.totalMin ? `${stats.pomoCount} focus session${stats.pomoCount === 1 ? "" : "s"}` : "Tap Focus to begin",
      icon: Timer,
      tone: "gradient-stat-a",
      to: "/focus",
    },
    {
      label: "Assignments",
      value: stats?.dueCount ? `${stats.dueCount} waiting for you` : "You're all caught up 🎉",
      hint: stats?.dueCount ? "Pick the easiest one first" : "Nice work staying on top of it",
      icon: ClipboardList,
      tone: "gradient-stat-c",
      to: "/assignments",
    },
    {
      label: "Journal streak",
      value: streak ? `${streak} day${streak === 1 ? "" : "s"}` : "Start your streak today",
      hint: streak ? "Keep it going, one line is enough" : "Even one sentence counts",
      icon: NotebookPen,
      tone: "gradient-stat-d",
      to: "/journal",
      badge: streak ? <StreakFlame days={streak} /> : null,
    },
    {
      label: "Today's mood",
      value: stats?.moodDone ? "Checked in ✓" : "How are you feeling?",
      hint: stats?.moodDone ? "Thanks for sharing — we've got you" : "10 seconds. That's all it takes.",
      icon: Smile,
      tone: "gradient-stat-b",
      to: "/mood",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl gradient-hero p-6 md:p-8 border border-white/40 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="mascot-bob shrink-0 self-start md:self-center">
            <Mascot mood={mood} size={112} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium text-primary/80">{hello}, {name}</div>
            <h1 className="font-display text-2xl md:text-3xl font-semibold leading-tight mt-1">
              {line}
            </h1>
            <p className="text-sm text-foreground/70 mt-2 max-w-lg">
              I'm Buddy. I'll nudge you gently through the day — nothing you can't handle.
            </p>
          </div>
          {streak && streak > 0 ? (
            <div className="hidden md:block">
              <StreakFlame days={streak} />
            </div>
          ) : null}
        </div>
      </section>

      {/* Concern-first entry */}
      <ConcernGrid />

      {/* Stat cards, warmer */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className="group">
            <Card className={`${s.tone} border-white/40 hover:shadow-md hover:-translate-y-0.5 transition-all h-full`}>
              <CardContent className="p-4 h-full flex flex-col gap-2">
                <div className="flex items-start justify-between">
                  <div className="size-9 rounded-xl bg-white/70 grid place-items-center text-foreground/70 shadow-sm">
                    <s.icon className="size-4" />
                  </div>
                  {s.badge}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-foreground/60">{s.label}</div>
                  <div className="font-display text-lg font-semibold leading-tight mt-0.5">{s.value}</div>
                  <div className="text-[11px] text-foreground/60 mt-1">{s.hint}</div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Daily motivation — the anchor */}
      <section>
        <Card className="gradient-motivation border-0 shadow-lg overflow-hidden">
          <CardContent className="p-6 md:p-7 relative">
            <div className="flex items-start gap-4">
              <div className="size-11 rounded-2xl bg-white/25 backdrop-blur grid place-items-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-widest opacity-90">Daily dose of motivation</div>
                <p className="font-display text-lg md:text-xl font-semibold mt-1 leading-snug">
                  {motivation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {(announcements?.length ?? 0) > 0 && (
        <section>
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">From your mentors</div>
          <div className="grid md:grid-cols-3 gap-3">
            {announcements!.map((a) => (
              <div key={a.id} className="rounded-2xl bg-secondary/60 p-4 border border-border/50">
                <div className="font-medium">{a.title}</div>
                {a.body && <div className="text-sm text-muted-foreground mt-1 line-clamp-3">{a.body}</div>}
                {a.cta_url && <a href={a.cta_url} target="_blank" rel="noreferrer" className="text-primary text-sm mt-2 inline-block">Learn more →</a>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions kept for module-savvy users */}
      <section>
        <div className="text-sm font-medium mb-3 text-muted-foreground">Or jump straight in</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/focus", label: "Focus timer", icon: Timer },
            { to: "/classes", label: "Recorded classes", icon: BookOpen },
            { to: "/journal", label: stats?.journaled ? "Journal ✓" : "Write today", icon: NotebookPen },
            { to: "/meditate", label: "Meditate", icon: Wind },
            { to: "/todo", label: "Today's to-do", icon: ListChecks },
            { to: "/assignments", label: "Assignments", icon: ClipboardList },
          ].map((q) => (
            <Link key={q.to} to={q.to} className="soft-card p-4 hover:bg-secondary/50 transition group flex items-center gap-3">
              <div className="size-9 rounded-xl bg-secondary grid place-items-center text-primary shrink-0">
                <q.icon className="size-4" />
              </div>
              <div className="text-sm font-medium truncate">{q.label}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
