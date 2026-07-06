import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/meditations")({ component: AdminMeds });

function AdminMeds() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", category: "focus", audio_url: "", duration_min: 10, tags: "" });
  const { data } = useQuery({ queryKey: ["adm-meds"], queryFn: async () => (await supabase.from("meditations").select("*").order("created_at", { ascending: false })).data ?? [] });
  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("meditations").insert({ ...f, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Added"); setF({ title: "", category: "focus", audio_url: "", duration_min: 10, tags: "" }); qc.invalidateQueries({ queryKey: ["adm-meds"] }); },
  });
  const del = useMutation({ mutationFn: async (id: string) => { await supabase.from("meditations").delete().eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-meds"] }) });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Meditations</h1>
      <Card><CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Category</Label><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="focus / anxiety / sleep" /></div>
          <div className="md:col-span-2"><Label>Audio URL</Label><Input value={f.audio_url} onChange={(e) => setF({ ...f, audio_url: e.target.value })} /></div>
          <div><Label>Duration (min)</Label><Input type="number" value={f.duration_min} onChange={(e) => setF({ ...f, duration_min: Number(e.target.value) })} /></div>
          <div><Label>Tags (comma separated)</Label><Input value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} /></div>
        </div>
        <Button onClick={() => add.mutate()} disabled={!f.title || !f.audio_url}>Add</Button>
      </CardContent></Card>
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((m) => (
          <Card key={m.id}><CardContent className="p-4 flex justify-between items-start gap-2">
            <div><div className="font-medium">{m.title}</div><div className="text-xs text-muted-foreground">{m.category} · {m.duration_min} min</div></div>
            <Button size="icon" variant="ghost" onClick={() => del.mutate(m.id)}><Trash2 className="size-4" /></Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
