import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wind, Play, Pause } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Mascot } from "@/components/mascot";

export const Route = createFileRoute("/meditate")({
  head: () => ({ meta: [{ title: "Meditate — Guiding Mentor" }] }),
  component: () => <Protected><Meditate /></Protected>,
});

function Meditate() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data: meds } = useQuery({
    queryKey: ["meditations"],
    queryFn: async () => (await supabase.from("meditations").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: todayMood } = useQuery({
    queryKey: ["mood-today", uid],
    queryFn: async () => (await supabase.from("mood_logs").select("score").eq("user_id", uid!).eq("log_date", format(new Date(), "yyyy-MM-dd")).maybeSingle()).data,
    enabled: !!uid,
  });

  const recommended = (() => {
    if (!meds?.length) return null;
    if (todayMood?.score && todayMood.score <= 2) return meds.find((m) => m.category?.toLowerCase().includes("anxiety")) ?? meds[0];
    return meds.find((m) => m.category?.toLowerCase().includes("focus")) ?? meds[0];
  })();

  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Mascot mood="neutral" size={64} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">A moment for you</h1>
          <p className="text-muted-foreground text-sm">Short sessions for breathing, focus, sleep, and exam anxiety.</p>
        </div>
      </div>

      {recommended && (
        <Card className="border-primary/40"><CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2"><Wind className="size-4 text-primary" /><span className="text-xs uppercase tracking-wider text-primary font-medium">Recommended today</span></div>
          <div className="font-medium">{recommended.title}</div>
          <div className="text-sm text-muted-foreground">{recommended.category} · {recommended.duration_min} min</div>
          <audio className="mt-3 w-full" controls src={recommended.audio_url} onPlay={async () => uid && supabase.from("meditation_plays" as any).insert({ user_id: uid, meditation_id: recommended.id }).then(() => {})} />
        </CardContent></Card>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {meds?.map((m) => (
          <Card key={m.id}><CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.category} · {m.duration_min} min</div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setPlaying(playing === m.id ? null : m.id)}>
                {playing === m.id ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
            </div>
            {playing === m.id && <audio className="mt-3 w-full" controls autoPlay src={m.audio_url} />}
            <div className="flex gap-1 flex-wrap mt-2">
              {(m.tags ?? []).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          </CardContent></Card>
        ))}
        {!meds?.length && <Card><CardContent className="p-8 text-center text-muted-foreground">No meditations added yet.</CardContent></Card>}
      </div>
    </div>
  );
}
