import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/todo")({
  head: () => ({ meta: [{ title: "To-do — Guiding Mentor" }] }),
  component: () => <Protected><TodoPage /></Protected>,
});

function TodoPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [title, setTitle] = useState("");

  const { data: todos } = useQuery({
    queryKey: ["todos", uid, today],
    queryFn: async () => (await supabase.from("todos").select("*").eq("user_id", uid!).eq("due_date", today).order("is_mandatory", { ascending: false })).data ?? [],
    enabled: !!uid,
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("todos").insert({ user_id: uid!, title, due_date: today });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["todos", uid, today] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("todos").update({ done }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", uid, today] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("todos").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos", uid, today] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Today's to-do</h1>
        <p className="text-muted-foreground text-sm">Mandatory items come from your mentor.</p>
      </div>
      <Card><CardContent className="p-5 space-y-3">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (title.trim()) add.mutate(); }}>
          <Input placeholder="Add a task…" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button type="submit">Add</Button>
        </form>
        <div className="space-y-1">
          {todos?.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-secondary/50">
              <Checkbox checked={t.done} onCheckedChange={(v) => toggle.mutate({ id: t.id, done: !!v })} />
              <div className={`flex-1 ${t.done ? "line-through text-muted-foreground" : ""}`}>{t.title}</div>
              {t.is_mandatory && <Badge variant="secondary">Mandatory</Badge>}
              {!t.is_mandatory && (
                <Button size="icon" variant="ghost" onClick={() => del.mutate(t.id)}><Trash2 className="size-4" /></Button>
              )}
            </div>
          ))}
          {!todos?.length && <div className="text-sm text-muted-foreground text-center py-4">Nothing yet. Add your first task.</div>}
        </div>
      </CardContent></Card>
    </div>
  );
}
