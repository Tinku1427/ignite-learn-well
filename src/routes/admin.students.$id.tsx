import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/students/$id")({ component: StudentDetail });

function StudentDetail() {
  const { id } = useParams({ from: "/admin/students/$id" });

  const { data } = useQuery({
    queryKey: ["admin-student", id],
    queryFn: async () => {
      const [p, pomos, subs, journals, moods, resp] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("pomodoro_sessions").select("*").eq("user_id", id).order("completed_at", { ascending: false }).limit(30),
        supabase.from("assignment_submissions").select("*, assignments(title)").eq("user_id", id).order("submitted_at", { ascending: false }),
        supabase.from("journal_entries").select("entry_date, flag_for_mentor, body").eq("user_id", id).order("entry_date", { ascending: false }).limit(30),
        supabase.from("mood_logs").select("*").eq("user_id", id).order("log_date", { ascending: false }).limit(30),
        supabase.from("assessment_responses").select("*, assessments(title)").eq("user_id", id).order("created_at", { ascending: false }),
      ]);
      const totalMin = (pomos.data ?? []).reduce((s, r) => s + (r.duration_min ?? 0), 0);
      return { profile: p.data, pomos: pomos.data ?? [], subs: subs.data ?? [], journals: journals.data ?? [], moods: moods.data ?? [], resp: resp.data ?? [], totalMin };
    },
  });

  if (!data?.profile) return <div className="text-muted-foreground">Loading…</div>;
  const p = data.profile;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">{p.full_name || "—"}</h1>
        <p className="text-muted-foreground text-sm">{p.exam ?? "—"} · Target {p.target_year ?? "—"} · {p.phone ?? "no phone"}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Focus min (30d)", v: data.totalMin },
          { l: "Submissions", v: data.subs.length },
          { l: "Journal entries", v: data.journals.length },
          { l: "Assessments", v: data.resp.length },
        ].map((k) => (
          <Card key={k.l}><CardContent className="p-4">
            <div className="text-2xl font-display font-semibold">{k.v}</div>
            <div className="text-xs text-muted-foreground">{k.l}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Recent submissions</div>
          <div className="space-y-1 text-sm">
            {data.subs.slice(0, 6).map((s) => (
              <div key={s.id} className="flex justify-between">
                <span className="truncate">{(s as any).assignments?.title ?? "—"}</span>
                <Badge variant="secondary">{s.status}</Badge>
              </div>
            ))}
            {!data.subs.length && <div className="text-muted-foreground text-sm">None</div>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Mood check-ins</div>
          <div className="space-y-1 text-sm">
            {data.moods.slice(0, 6).map((m) => (
              <div key={m.id} className="flex justify-between"><span>{m.log_date}</span><span>{"⬤".repeat(m.score)}</span></div>
            ))}
            {!data.moods.length && <div className="text-muted-foreground text-sm">None</div>}
          </div>
        </CardContent></Card>
        <Card className="md:col-span-2"><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Journal (completion + flagged entries)</div>
          <div className="text-xs text-muted-foreground mb-3">Only entries the student flagged for mentor review are shown in full.</div>
          <div className="space-y-2 text-sm">
            {data.journals.slice(0, 10).map((j) => (
              <div key={j.entry_date} className="border-b pb-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(j.entry_date), "d MMM yyyy")}</span>
                  <span>{j.flag_for_mentor ? <Badge variant="destructive">Flagged</Badge> : <Badge variant="outline">Private ✓ completed</Badge>}</span>
                </div>
                {j.flag_for_mentor && <div className="mt-1">{j.body}</div>}
              </div>
            ))}
            {!data.journals.length && <div className="text-muted-foreground">No entries yet.</div>}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}
