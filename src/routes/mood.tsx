import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { Mascot, type MascotMood } from "@/components/mascot";
import { format, subDays } from "date-fns";
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, Tooltip } from "recharts";

export const Route = createFileRoute("/mood")({
  head: () => ({ meta: [{ title: "Mood check-in — Guiding Mentor" }] }),
  component: () => <Protected><Mood /></Protected>,
});

const OPTIONS = [
  { s: 1, e: "😞", l: "Stressed" },
  { s: 2, e: "😕", l: "Low" },
  { s: 3, e: "😐", l: "Okay" },
  { s: 4, e: "🙂", l: "Good" },
  { s: 5, e: "😊", l: "Calm" },
];

function Mood() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [score, setScore] = useState<number | null>(null);

  const { data: logs } = useQuery({
    queryKey: ["mood", uid],
    queryFn: async () => (await supabase.from("mood_logs").select("*").eq("user_id", uid!).order("log_date", { ascending: true }).limit(60)).data ?? [],
    enabled: !!uid,
  });

  const todayLog = logs?.find((l) => l.log_date === today);

  const save = useMutation({
    mutationFn: async () => {
      if (!score) return;
      const { error } = await supabase.from("mood_logs").upsert({ user_id: uid!, log_date: today, score }, { onConflict: "user_id,log_date" });
      if (error) throw error;
    },
    onSuccess: () => {
      celebrate(score && score >= 4 ? "Love that. Logged and locked in." : "Thanks for checking in. We've got you.");
      qc.invalidateQueries({ queryKey: ["mood", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const chartData = (() => {
    const map = new Map((logs ?? []).map((l) => [l.log_date, l.score]));
    return Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      return { date: d.slice(5), score: map.get(d) ?? null };
    });
  })();

  const active = score ?? todayLog?.score ?? null;
  const mascotMood: MascotMood =
    active == null ? "neutral" : active <= 2 ? "concerned" : active >= 4 ? "celebrating" : "encouraging";
  const supportLine =
    active == null ? "No wrong answer here. Just tap what fits." :
    active <= 2 ? "Thanks for being honest. Rough days pass — I'm here." :
    active === 3 ? "An okay day is still a day. Nice going." :
    "Love this energy. Let's channel it.";

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Mascot mood={mascotMood} size={72} className="shrink-0 mascot-bob" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">How are you feeling?</h1>
          <p className="text-muted-foreground text-sm">Everyone has off days — that's what this is here for. 10 seconds, honest answer.</p>
        </div>
      </div>
      <Card><CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-5 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.s}
              onClick={() => setScore(o.s)}
              className={`rounded-2xl p-4 text-center border transition ${
                score === o.s || todayLog?.score === o.s
                  ? "bg-secondary border-primary scale-[1.03]"
                  : "hover:bg-secondary/50"
              }`}
            >
              <div className="text-3xl">{o.e}</div>
              <div className="text-xs text-muted-foreground mt-1">{o.l}</div>
            </button>
          ))}
        </div>
        <div key={active ?? "none"} className="text-sm text-foreground/70 pop-in">{supportLine}</div>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !score}>
          {todayLog ? "Update today's mood" : "Save today's mood"}
        </Button>
      </CardContent></Card>

      <Card><CardContent className="p-5">
        <div className="text-sm font-medium mb-3">Last 30 days</div>
        <div className="h-56">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent></Card>
    </div>
  );
}
