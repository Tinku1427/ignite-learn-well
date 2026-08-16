import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Check, Shuffle } from "lucide-react";

import { Scene } from "@/components/scene";
import { Celebrate } from "@/components/celebrate";

export const Route = createFileRoute("/practice/affirm")({ component: Affirm });

type Aff = { id: string; body: string; category: string | null };

function Affirm() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [idx, setIdx] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  const { data: list = [] } = useQuery({
    queryKey: ["affirmations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("affirmations").select("id,body,category").eq("is_published", true);
      if (error) throw error;
      return data as Aff[];
    },
  });

  const today = new Date().toISOString().slice(0, 10);
  const seedIdx = useMemo(() => {
    if (!list.length) return 0;
    let h = 0; for (const c of today) h = (h * 31 + c.charCodeAt(0)) | 0;
    return Math.abs(h) % list.length;
  }, [list.length, today]);

  const cur = list[(seedIdx + idx) % Math.max(list.length, 1)];

  const { data: doneToday } = useQuery({
    enabled: !!user,
    queryKey: ["aff-done", user?.id, today],
    queryFn: async () => {
      const { data } = await supabase
        .from("affirmation_completions")
        .select("id")
        .eq("user_id", user!.id)
        .gte("created_at", `${today}T00:00:00Z`)
        .limit(1);
      return (data ?? []).length > 0;
    },
  });

  const mark = useMutation({
    mutationFn: async () => {
      if (!user || !cur) return;
      const { error } = await supabase.from("affirmation_completions").insert({
        user_id: user.id, affirmation_id: cur.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCelebrate(true);
      qc.invalidateQueries({ queryKey: ["aff-done"] });
    },
  });

  if (!cur) return <div className="soft-card p-8 text-sm text-muted-foreground">No affirmations published yet.</div>;

  return (
    <div className="space-y-6">
      <Celebrate scene="affirm" open={celebrate} onClose={() => setCelebrate(false)} intensity="soft" />
      <div className="soft-card relative overflow-hidden bg-gradient-to-br from-paper via-card to-sage-soft/40 p-8 md:p-12">
        <div className="flex items-start justify-between gap-4">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Today's line</div>
          <Scene kind="affirm" size={72} />
        </div>
        <p className="mt-4 font-display text-3xl leading-snug md:text-4xl">"{cur.body}"</p>
        {cur.category && <div className="mt-6 text-xs text-muted-foreground">— {cur.category}</div>}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button
            onClick={() => mark.mutate()}
            disabled={!!doneToday || mark.isPending}
            className="rounded-full"
            size="lg"
          >
            <Check className="mr-2 size-4" />
            {doneToday ? "Held today" : "I read this out loud"}
          </Button>
          <Button variant="outline" className="rounded-full" onClick={() => setIdx((i) => i + 1)}>
            <Shuffle className="mr-2 size-4" /> Another
          </Button>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Say it slowly. Even if you don't believe it yet.
      </p>
    </div>
  );
}
