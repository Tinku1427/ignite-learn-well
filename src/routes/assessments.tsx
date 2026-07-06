import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export const Route = createFileRoute("/assessments")({
  head: () => ({ meta: [{ title: "Assessments — Guiding Mentor" }] }),
  component: () => <Protected><Assessments /></Protected>,
});

type Question = { id: string; text: string; options: { label: string; score: number }[] };

function Assessments() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const { data } = useQuery({
    queryKey: ["assessments", uid],
    queryFn: async () => {
      const [a, r] = await Promise.all([
        supabase.from("assessments").select("*").eq("active", true),
        supabase.from("assessment_responses").select("*").eq("user_id", uid!),
      ]);
      return { assessments: a.data ?? [], responses: r.data ?? [] };
    },
    enabled: !!uid,
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!active) return;
      const a = data!.assessments.find((x) => x.id === active)!;
      const qs = (a.questions as unknown as Question[]) ?? [];
      const score = qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0);
      const interp = score <= qs.length ? "Low stress — keep it up 👍" : score <= qs.length * 2 ? "Moderate — consider a check-in" : "High — please book a mentor session";
      const { error } = await supabase.from("assessment_responses").insert({ assessment_id: active, user_id: uid!, answers, score, interpretation: interp });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Submitted"); setActive(null); setAnswers({}); qc.invalidateQueries({ queryKey: ["assessments", uid] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const openAssessment = data?.assessments.find((a) => a.id === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Self-assessments</h1>
        <p className="text-muted-foreground text-sm">Short check-ins on stress, motivation, and sleep.</p>
      </div>

      {!openAssessment ? (
        <div className="grid md:grid-cols-2 gap-3">
          {data?.assessments.map((a) => {
            const last = data.responses.filter((r) => r.assessment_id === a.id).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
            return (
              <Card key={a.id}><CardContent className="p-5">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-muted-foreground">{a.description}</div>
                {last && <div className="text-xs mt-2">Last result: <span className="font-medium">{last.interpretation}</span></div>}
                <Button size="sm" className="mt-3" onClick={() => setActive(a.id)}>Take assessment</Button>
              </CardContent></Card>
            );
          })}
          {!data?.assessments.length && <Card><CardContent className="p-8 text-center text-muted-foreground">No assessments available yet.</CardContent></Card>}
        </div>
      ) : (
        <Card><CardContent className="p-5 space-y-4">
          <div>
            <div className="font-medium">{openAssessment.title}</div>
            <div className="text-sm text-muted-foreground">{openAssessment.description}</div>
          </div>
          {((openAssessment.questions as unknown as Question[]) ?? []).map((q) => (
            <div key={q.id} className="space-y-2">
              <div className="text-sm font-medium">{q.text}</div>
              <RadioGroup value={String(answers[q.id] ?? "")} onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: Number(v) }))}>
                {q.options.map((o, i) => (
                  <label key={i} className="flex items-center gap-2 text-sm">
                    <RadioGroupItem value={String(o.score)} /> {o.label}
                  </label>
                ))}
              </RadioGroup>
            </div>
          ))}
          <div className="flex gap-2">
            <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Submit</Button>
            <Button variant="ghost" onClick={() => { setActive(null); setAnswers({}); }}>Cancel</Button>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
