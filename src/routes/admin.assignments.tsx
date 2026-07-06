import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/assignments")({ component: AdminAssignments });

function AdminAssignments() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", instructions: "", due_at: "", subject_id: "", attachment_url: "" });
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const { data } = useQuery({
    queryKey: ["admin-assignments"],
    queryFn: async () => {
      const [a, s, subs] = await Promise.all([
        supabase.from("assignments").select("*, subjects(name)").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*"),
        supabase.from("assignment_submissions").select("*, profiles(full_name)").order("submitted_at", { ascending: false }),
      ]);
      return { assignments: a.data ?? [], subjects: s.data ?? [], subs: subs.data ?? [] };
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("assignments").insert({
        title: form.title, instructions: form.instructions, subject_id: form.subject_id || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null, attachment_url: form.attachment_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); setForm({ title: "", instructions: "", due_at: "", subject_id: "", attachment_url: "" }); qc.invalidateQueries({ queryKey: ["admin-assignments"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async () => {
      if (!reviewId) return;
      const { error } = await supabase.from("assignment_submissions").update({ status: "reviewed", grade, feedback, reviewed_at: new Date().toISOString() }).eq("id", reviewId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Reviewed"); setReviewId(null); setGrade(""); setFeedback(""); qc.invalidateQueries({ queryKey: ["admin-assignments"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Assignments</h1>
      <Card><CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Subject</Label>
            <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{data?.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.exam})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Due date</Label><Input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} /></div>
          <div><Label>Attachment URL</Label><Input value={form.attachment_url} onChange={(e) => setForm({ ...form, attachment_url: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Instructions</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></div>
        </div>
        <Button onClick={() => create.mutate()} disabled={!form.title}>Create assignment</Button>
      </CardContent></Card>

      <div className="grid gap-3">
        {data?.assignments.map((a) => {
          const relatedSubs = data.subs.filter((s) => s.assignment_id === a.id);
          return (
            <Card key={a.id}><CardContent className="p-5">
              <div className="flex justify-between flex-wrap gap-2">
                <div>
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs text-muted-foreground">{(a as any).subjects?.name ?? "General"}</div>
                </div>
                <Badge variant="secondary">{relatedSubs.length} submissions</Badge>
              </div>
              {relatedSubs.length > 0 && (
                <div className="mt-3 border-t pt-3 space-y-2">
                  {relatedSubs.map((s) => (
                    <div key={s.id} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-medium">{(s as any).profiles?.full_name || "—"}</div>
                        <Badge variant={s.status === "reviewed" ? "default" : "secondary"}>{s.status}</Badge>
                      </div>
                      {s.text_answer && <div className="text-sm mt-1 whitespace-pre-wrap">{s.text_answer}</div>}
                      {s.feedback && <div className="text-xs text-muted-foreground mt-1">Feedback: {s.feedback}</div>}
                      {reviewId === s.id ? (
                        <div className="mt-2 space-y-2">
                          <Input placeholder="Grade (e.g. A / 8/10)" value={grade} onChange={(e) => setGrade(e.target.value)} />
                          <Textarea placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                          <div className="flex gap-2"><Button size="sm" onClick={() => review.mutate()}>Save</Button><Button size="sm" variant="ghost" onClick={() => setReviewId(null)}>Cancel</Button></div>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" className="mt-2" onClick={() => { setReviewId(s.id); setGrade(s.grade ?? ""); setFeedback(s.feedback ?? ""); }}>Review</Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent></Card>
          );
        })}
      </div>
    </div>
  );
}
