import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { WellnessRing } from "@/components/wellness-ring";
import { BeforeAfter } from "@/components/before-after";
import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";
import { Check, Plus, Trash2 } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { cn } from "@/lib/utils";
const chartUp = { url: "/arc.svg" };

export const Route = createFileRoute("/me")({ component: () => <Protected><Me /></Protected> });

type Todo = { id: string; title: string; done: boolean; is_mandatory: boolean; due_date: string | null };

function Me() {
  const router = useRouter();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");

  const { data: todos = [] } = useQuery({
    enabled: !!user,
    queryKey: ["todos", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("todos")
        .select("id,title,done,is_mandatory,due_date")
        .eq("user_id", user!.id)
        .order("done", { ascending: true })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Todo[];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user || !title.trim()) return;
      const { error } = await supabase.from("todos").insert({ user_id: user.id, title: title.trim() });
      if (error) throw error;
    },
    onSuccess: () => { setTitle(""); qc.invalidateQueries({ queryKey: ["todos"] }); },
  });

  const toggle = useMutation({
    mutationFn: async (t: Todo) => {
      const { error } = await supabase.from("todos").update({ done: !t.done }).eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("todos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["todos"] }),
  });

  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><AppIcon name="avatar" size={14} /> Me</div>
        <h1 className="font-display text-3xl">Your arc</h1>
      </header>

      <BeforeAfter />

      <div className="soft-card p-6 flex flex-col items-center">
        <div className="relative grid place-items-center rounded-full bg-sage-soft/60 p-4 mb-4" style={{ width: 160, height: 160 }}>
          <img src={chartUp.url} alt="" aria-hidden="true" className="h-[110px] w-[110px] object-contain" />
        </div>
        <WellnessRing arcs={{ focus: 62, rest: 58, reflection: 70, connection: 45 }} size={180} />
        <p className="mt-4 text-center text-sm text-muted-foreground max-w-xs">
          The arc across your program will fill in as you practice.
        </p>
      </div>

      <div className="soft-card p-6">
        <h2 className="flex items-center gap-2 font-display text-xl"><AppIcon name="checklist" size={20} tone="ink" /> To-do</h2>
        <p className="mt-1 text-xs text-muted-foreground">Short list. Only what matters today.</p>
        <div className="mt-4 flex gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add.mutate()}
            placeholder="One thing…"
            className="flex-1 rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
          />
          <Button onClick={() => add.mutate()} disabled={!title.trim() || add.isPending} className="rounded-full">
            <Plus className="size-4" />
          </Button>
        </div>
        <ul className="mt-4 space-y-2">
          {todos.length === 0 && (
            <li className="text-sm text-muted-foreground">Nothing here. That's allowed.</li>
          )}
          {todos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2">
              <button
                onClick={() => toggle.mutate(t)}
                className={cn("grid size-6 place-items-center rounded-full border",
                  t.done ? "bg-primary text-primary-foreground border-primary" : "border-border")}
              >
                {t.done && <Check className="size-3.5" />}
              </button>
              <span className={cn("flex-1 text-sm", t.done && "line-through text-muted-foreground")}>{t.title}</span>
              <button onClick={() => remove.mutate(t.id)} className="text-muted-foreground hover:text-foreground">
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="soft-card p-6">
        <h2 className="font-display text-xl">Your journal is private</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only you can read it. Parents never see it. Coaches only if you tap "share with mentor" on that specific entry.
        </p>
      </div>

      <Button variant="outline" onClick={signOut} className="w-full rounded-full">Sign out</Button>
    </div>
  );
}
