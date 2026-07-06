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
import { Switch } from "@/components/ui/switch";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/classes")({ component: AdminClasses });

function AdminClasses() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: "", description: "", video_url: "", notes_url: "", duration_min: 30, subject_id: "", published: true });

  const { data } = useQuery({
    queryKey: ["admin-classes"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        supabase.from("classes").select("*, subjects(name, exam)").order("created_at", { ascending: false }),
        supabase.from("subjects").select("*").order("name"),
      ]);
      return { classes: c.data ?? [], subjects: s.data ?? [] };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("classes").insert({ ...form, subject_id: form.subject_id || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); setForm({ title: "", description: "", video_url: "", notes_url: "", duration_min: 30, subject_id: "", published: true }); qc.invalidateQueries({ queryKey: ["admin-classes"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("classes").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-classes"] }),
  });

  const togglePub = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => { await supabase.from("classes").update({ published }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-classes"] }),
  });

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-2xl font-semibold">Recorded classes</h1></div>
      <Card><CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><Label>Subject</Label>
            <Select value={form.subject_id} onValueChange={(v) => setForm({ ...form, subject_id: v })}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{data?.subjects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.exam})</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Video URL (YouTube / Vimeo unlisted)</Label><Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} /></div>
          <div><Label>Notes URL (PDF)</Label><Input value={form.notes_url} onChange={(e) => setForm({ ...form, notes_url: e.target.value })} /></div>
          <div><Label>Duration (min)</Label><Input type="number" value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !form.title || !form.video_url}>Add class</Button>
      </CardContent></Card>

      <div className="grid md:grid-cols-2 gap-3">
        {data?.classes.map((c) => (
          <Card key={c.id}><CardContent className="p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-medium">{c.title}</div>
                <div className="text-xs text-muted-foreground">{(c as any).subjects?.name} · {c.duration_min} min</div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)}><Trash2 className="size-4" /></Button>
            </div>
            <div className="flex items-center gap-2 mt-3 text-sm">
              <Switch checked={c.published} onCheckedChange={(v) => togglePub.mutate({ id: c.id, published: v })} /> Published
            </div>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
