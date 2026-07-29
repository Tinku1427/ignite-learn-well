import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/announcements")({
  component: () => <><Announcements /></>,
});

function Announcements() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cohortId, setCohortId] = useState("");

  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => (await supabase.from("cohorts").select("id, name")).data ?? [],
  });

  const { data: rows = [] } = useQuery({
    queryKey: ["announcements"],
    queryFn: async () => (await supabase.from("announcements").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("announcements").insert({
        title, body, active: true, starts_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Sent."); setTitle(""); setBody(""); qc.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const toggle = useMutation({
    mutationFn: async (r: any) => { await supabase.from("announcements").update({ active: !r.active }).eq("id", r.id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin · Announcements</div>
        <h1 className="font-display text-3xl">Broadcasts</h1>
      </header>

      <div className="soft-card p-5 space-y-3 max-w-2xl">
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Body</Label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className="w-full rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm" />
        </div>
        <div>
          <Label>Cohort (optional)</Label>
          <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className="w-full rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm">
            <option value="">Whole cohort</option>
            {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button onClick={() => create.mutate()} disabled={!title.trim() || create.isPending} className="rounded-full">Send</Button>
      </div>

      <ul className="space-y-2">
        {rows.map((r: any) => (
          <li key={r.id} className="soft-card p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground max-w-lg line-clamp-2">{r.body}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggle.mutate(r)}>{r.active ? "Deactivate" : "Activate"}</Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
