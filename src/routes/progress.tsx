import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { format, subDays } from "date-fns";
import { Award } from "lucide-react";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Progress — Guiding Mentor" }] }),
  component: () => <Protected><ProgressPage /></Protected>,
});

function ProgressPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data } = useQuery({
    queryKey: ["progress", uid],
    queryFn: async () => {
      const [pomos, subs, journals, meds] = await Promise.all([
        supabase.from("pomodoro_sessions").select("duration_min, completed_at").eq("user_id", uid!),
        supabase.from("assignment_submissions").select("id").eq("user_id", uid!),
        supabase.from("journal_entries").select("entry_date").eq("user_id", uid!),
        supabase.from("mood_logs").select("log_date, score").eq("user_id", uid!),
      ]);
      return { pomos: pomos.data ?? [], subs: subs.data ?? [], journals: journals.data ?? [], meds: meds.data ?? [] };
    },
    enabled: !!uid,
  });

  const totalMin = (data?.pomos ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
  const totalSessions = data?.pomos.length ?? 0;
  const journalCount = data?.journals.length ?? 0;

  const journalDates = new Set((data?.journals ?? []).map((j) => j.entry_date));
  let streak = 0;
  const cur = new Date();
  while (journalDates.has(format(cur, "yyyy-MM-dd"))) { streak++; cur.setDate(cur.getDate() - 1); }

  const chart = Array.from({ length: 14 }, (_, i) => {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    const min = (data?.pomos ?? []).filter((p) => (p.completed_at as string).slice(0, 10) === d).reduce((s, r) => s + (r.duration_min ?? 0), 0);
    return { date: d.slice(5), minutes: min };
  });

  const badges = [
    { earned: streak >= 7, name: "7-day journal streak" },
    { earned: totalSessions >= 50, name: "50 focus sessions" },
    { earned: (data?.subs.length ?? 0) >= 10, name: "10 assignments submitted" },
    { earned: totalMin >= 3000, name: "50 hours studied" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Your progress</h1>
        <p className="text-muted-foreground text-sm">Small steps, every day.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Focus minutes", v: totalMin },
          { l: "Focus sessions", v: totalSessions },
          { l: "Journal entries", v: journalCount },
          { l: "Journal streak", v: `${streak}d` },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <div className="text-2xl font-display font-semibold">{k.v}</div>
            <div className="text-xs text-muted-foreground">{k.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-5">
        <div className="text-sm font-medium mb-3">Study minutes (last 14 days)</div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={chart}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="minutes" fill="var(--primary)" radius={[6,6,0,0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-5">
        <div className="text-sm font-medium mb-3">Badges</div>
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <Badge key={b.name} variant={b.earned ? "default" : "outline"} className="gap-1"><Award className="size-3" />{b.name}</Badge>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}
