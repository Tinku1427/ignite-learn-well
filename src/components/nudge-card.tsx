import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAuth as _ } from "@/hooks/use-auth";
import { Buddy } from "@/components/buddy";
import { Button } from "@/components/ui/button";

/**
 * The agent's voice — the one place the mascot appears for students.
 * Shows the newest undismissed nudge; marks it seen on render.
 */
export function NudgeCard() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: nudge } = useQuery({
    enabled: !!user,
    queryKey: ["my-nudge", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("nudges")
        .select("id, body, tone, created_at, seen_at")
        .eq("user_id", user!.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const dismiss = useMutation({
    mutationFn: async () => {
      if (!nudge) return;
      await supabase.from("nudges").update({ dismissed_at: new Date().toISOString(), seen_at: nudge.seen_at ?? new Date().toISOString() }).eq("id", nudge.id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-nudge"] }),
  });

  const seen = useMutation({
    mutationFn: async () => {
      if (!nudge || nudge.seen_at) return;
      await supabase.from("nudges").update({ seen_at: new Date().toISOString() }).eq("id", nudge.id);
    },
  });

  if (!nudge) return null;
  if (!nudge.seen_at && !seen.isPending) seen.mutate();

  return (
    <section className="soft-card flex items-start gap-4 p-5">
      <Buddy mood="neutral" size={64} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">A note for you</div>
        <p className="mt-1 text-sm">{nudge.body}</p>
        <Button size="sm" variant="ghost" className="mt-2 h-7 rounded-full px-3 text-xs"
          onClick={() => dismiss.mutate()}>
          Thanks, got it
        </Button>
      </div>
    </section>
  );
}
