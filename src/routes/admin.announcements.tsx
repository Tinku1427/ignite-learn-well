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

export const Route = createFileRoute("/admin/announcements")({ component: AdminAnn });

function AdminAnn() {
  const qc = useQueryClient();
  const [f, setF] = useState({ title: "", body: "", image_url: "", cta_url: "" });
  const { data } = useQuery({ queryKey: ["adm-ann"], queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [] });
  const add = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("announcements").insert(f); if (error) throw error; },
    onSuccess: () => { toast.success("Added"); setF({ title: "", body: "", image_url: "", cta_url: "" }); qc.invalidateQueries({ queryKey: ["adm-ann"] }); },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { await supabase.from("announcements").update({ active }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-ann"] }),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Announcements</h1>
      <Card><CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>CTA URL</Label><Input value={f.cta_url} onChange={(e) => setF({ ...f, cta_url: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Body</Label><Textarea value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} /></div>
        </div>
        <Button onClick={() => add.mutate()} disabled={!f.title}>Publish</Button>
      </CardContent></Card>
      <div className="grid md:grid-cols-2 gap-3">
        {data?.map((a) => (
          <Card key={a.id}><CardContent className="p-4">
            <div className="font-medium">{a.title}</div>
            <div className="text-sm text-muted-foreground">{a.body}</div>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => toggle.mutate({ id: a.id, active: !a.active })}>{a.active ? "Deactivate" : "Activate"}</Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
