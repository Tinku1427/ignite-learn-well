import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/assessments")({ component: AdminAssess });

function AdminAssess() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", description: "", questions: '[{"id":"q1","text":"How often did you feel overwhelmed this week?","options":[{"label":"Rarely","score":0},{"label":"Sometimes","score":1},{"label":"Often","score":2},{"label":"Always","score":3}]}]' });
  const { data } = useQuery({ queryKey: ["adm-assess"], queryFn: async () => (await supabase.from("assessments").select("*, assessment_responses(id, score, interpretation, user_id)").order("created_at", { ascending: false })).data ?? [] });
  const add = useMutation({
    mutationFn: async () => {
      let qs: any;
      try { qs = JSON.parse(f.questions); } catch { throw new Error("Questions must be valid JSON"); }
      const { error } = await supabase.from("assessments").insert({ title: f.title, description: f.description, questions: qs });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); qc.invalidateQueries({ queryKey: ["adm-assess"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Assessments</h1>
      <Card><CardContent className="p-5 space-y-3">
        <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
        <div><Label>Description</Label><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
        <div><Label>Questions (JSON)</Label><Textarea rows={8} value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} /></div>
        <Button onClick={() => add.mutate()} disabled={!f.title}>Create</Button>
      </CardContent></Card>
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((a) => {
          const resps = (a as any).assessment_responses ?? [];
          const highStress = resps.filter((r: any) => (r.score ?? 0) >= 5).length;
          return (
            <Card key={a.id}><CardContent className="p-4">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground">{a.description}</div>
              <div className="text-xs mt-2">{resps.length} responses · {highStress} high-stress flags</div>
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
