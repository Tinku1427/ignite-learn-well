import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, BookOpen, NotebookPen, ClipboardList, Flame, Smile, Wind, ListChecks } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Guiding Mentor" }] }),
  component: () => <Protected><Dashboard /></Protected>,
});

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

  const name = profile?.full_name || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-semibold">{greet}, {name}.</h1>
        <p className="text-muted-foreground text-sm">Here's your day at a glance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Study today", value: `${stats?.totalMin ?? 0} min`, icon: Timer, tone: "gradient-calm" },
          { label: "Pomodoros", value: String(stats?.pomoCount ?? 0), icon: Flame, tone: "gradient-warm" },
          { label: "Assignments due", value: String(stats?.dueCount ?? 0), icon: ClipboardList, tone: "gradient-calm" },
          { label: "Journal streak", value: `${streak ?? 0}d`, icon: NotebookPen, tone: "gradient-warm" },
        ].map((s) => (
          <Card key={s.label}><CardContent className="p-4">
            <div className={`size-9 rounded-xl ${s.tone} grid place-items-center text-primary-foreground mb-3`}>
              <s.icon className="size-4" />
            </div>
            <div className="text-2xl font-display font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      {(announcements?.length ?? 0) > 0 && (
        <Card><CardContent className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Announcements</div>
          <div className="grid md:grid-cols-3 gap-3">
            {announcements!.map((a) => (
              <div key={a.id} className="rounded-xl bg-secondary/60 p-4">
                <div className="font-medium">{a.title}</div>
                {a.body && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{a.body}</div>}
                {a.cta_url && <a href={a.cta_url} target="_blank" rel="noreferrer" className="text-primary text-sm mt-2 inline-block">Learn more →</a>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      <div>
        <div className="text-sm font-medium mb-3">Quick actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { to: "/focus", label: "Start Focus", icon: Timer },
            { to: "/classes", label: "Recorded Classes", icon: BookOpen },
            { to: "/journal", label: stats?.journaled ? "Journal ✓" : "Daily Journal", icon: NotebookPen },
            { to: "/mood", label: stats?.moodDone ? "Mood ✓" : "Mood check-in", icon: Smile },
            { to: "/meditate", label: "Meditate", icon: Wind },
            { to: "/todo", label: "Today's To-do", icon: ListChecks },
            { to: "/assignments", label: "Assignments", icon: ClipboardList },
          ].map((q) => (
            <Link key={q.to} to={q.to} className="soft-card p-4 hover:bg-secondary/50 transition group">
              <q.icon className="size-5 text-primary mb-2" />
              <div className="text-sm font-medium">{q.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
