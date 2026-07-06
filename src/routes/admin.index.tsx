import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/")({ component: AdminOverview });

function AdminOverview() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [students, pomos, moods, subs] = await Promise.all([
        supabase.from("profiles").select("id, full_name, exam, created_at"),
        supabase.from("pomodoro_sessions").select("user_id, completed_at").gte("completed_at", new Date(Date.now() - 7 * 864e5).toISOString()),
        supabase.from("mood_logs").select("user_id, score, log_date").gte("log_date", new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10)),
        supabase.from("assignment_submissions").select("id, user_id, submitted_at"),
      ]);
      const activeIds = new Set((pomos.data ?? []).map((p) => p.user_id));
      const avgMood = (() => {
        const arr = (moods.data ?? []).map((m) => m.score);
        return arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : "—";
      })();
      const atRisk = (students.data ?? []).filter((s) => {
        const uMoods = (moods.data ?? []).filter((m) => m.user_id === s.id).map((m) => m.score);
        const avg = uMoods.length ? uMoods.reduce((a, b) => a + b, 0) / uMoods.length : null;
        return !activeIds.has(s.id) || (avg !== null && avg <= 2);
      });
      return { students: students.data ?? [], activeIds, avgMood, atRisk, subs: subs.data ?? [] };
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">Snapshot of the batch's engagement and wellbeing.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Total students", v: data?.students.length ?? 0 },
          { l: "Active (7d)", v: data?.activeIds.size ?? 0 },
          { l: "Avg mood (30d)", v: data?.avgMood ?? "—" },
          { l: "Submissions", v: data?.subs.length ?? 0 },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <div className="text-2xl font-display font-semibold">{k.v}</div>
            <div className="text-xs text-muted-foreground">{k.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-5">
        <div className="text-sm font-medium mb-3">At-risk students</div>
        <div className="space-y-1">
          {(data?.atRisk ?? []).slice(0, 20).map((s) => (
            <Link key={s.id} to="/admin/students/$id" params={{ id: s.id }} className="flex items-center justify-between rounded-lg p-2 hover:bg-secondary/50">
              <div>
                <div className="text-sm font-medium">{s.full_name || "—"}</div>
                <div className="text-xs text-muted-foreground">{s.exam ?? "—"}</div>
              </div>
              <Badge variant="destructive">Check in</Badge>
            </Link>
          ))}
          {!data?.atRisk.length && <div className="text-sm text-muted-foreground">Everyone looks OK 💚</div>}
        </div>
      </CardContent></Card>
    </div>
  );
}
