import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { runAgentTask, listNudgeLog } from "@/lib/agent-admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Bot, Play, Moon } from "lucide-react";

export const Route = createFileRoute("/admin/agent")({
  component: () => <><Agent /></>,
});

type Settings = {
  enabled: boolean;
  amber_threshold: number;
  watch_threshold: number;
  low_mood_days: number;
  low_sleep_nights: number;
  silence_days: number;
  quiet_start: string;
  quiet_end: string;
};

function Agent() {
  const qc = useQueryClient();
  const run = useServerFn(runAgentTask);
  const nudgeLog = useServerFn(listNudgeLog);
  const [form, setForm] = useState<Settings | null>(null);

  const { data: settings } = useQuery({
    queryKey: ["agent-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agent_settings").select("*").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings && !form) {
      const { enabled, amber_threshold, watch_threshold, low_mood_days, low_sleep_nights, silence_days, quiet_start, quiet_end } = settings;
      setForm({ enabled, amber_threshold, watch_threshold, low_mood_days, low_sleep_nights, silence_days, quiet_start: quiet_start.slice(0, 5), quiet_end: quiet_end.slice(0, 5) });
    }
  }, [settings, form]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form) return;
      const { error } = await supabase.from("agent_settings").update({
        ...form,
        quiet_start: `${form.quiet_start}:00`,
        quiet_end: `${form.quiet_end}:00`,
        updated_at: new Date().toISOString(),
      }).eq("id", true);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agent settings saved."); qc.invalidateQueries({ queryKey: ["agent-settings"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const trigger = useMutation({
    mutationFn: (task: "probe" | "score" | "nudge" | "dry-run") => run({ data: { task } }),
    onSuccess: (res) => {
      toast.success(`Run finished (${res.status})`);
      qc.invalidateQueries({ queryKey: ["agent-nudge-log"] });
      qc.invalidateQueries({ queryKey: ["admin-agent-events"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Run failed"),
  });

  const { data: nudges = [] } = useQuery({
    queryKey: ["agent-nudge-log"],
    queryFn: () => nudgeLog(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ["admin-agent-events"],
    queryFn: async () =>
      (await supabase.from("agent_events")
        .select("id, user_id, event_type, detail, created_at")
        .order("created_at", { ascending: false }).limit(60)).data ?? [],
  });

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Bot size={14} /> Admin · Wellness Agent
        </div>
        <h1 className="font-display text-3xl">The quiet one, watching over everyone</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Every night it reads the last seven days of focus, rest, reflection and connection, scores each
          student, and writes at most one warm nudge each. Thresholds and quiet hours are yours to set.
        </p>
      </header>

      <section className="soft-card space-y-5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">Nightly agent</div>
            <div className="text-xs text-muted-foreground">Scoring 21:30 IST · nudges 21:45 IST</div>
          </div>
          <Switch checked={!!form?.enabled} onCheckedChange={(v) => set("enabled", v)} aria-label="Agent enabled" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Amber below</Label>
            <Input type="number" min={0} max={100} value={form?.amber_threshold ?? 0}
              onChange={(e) => set("amber_threshold", Number(e.target.value))} />
          </div>
          <div>
            <Label>Watch below</Label>
            <Input type="number" min={0} max={100} value={form?.watch_threshold ?? 0}
              onChange={(e) => set("watch_threshold", Number(e.target.value))} />
          </div>
          <div>
            <Label>Low-mood days</Label>
            <Input type="number" min={1} max={7} value={form?.low_mood_days ?? 0}
              onChange={(e) => set("low_mood_days", Number(e.target.value))} />
          </div>
          <div>
            <Label>Short-sleep nights</Label>
            <Input type="number" min={1} max={7} value={form?.low_sleep_nights ?? 0}
              onChange={(e) => set("low_sleep_nights", Number(e.target.value))} />
          </div>
          <div>
            <Label>Silence days</Label>
            <Input type="number" min={1} max={14} value={form?.silence_days ?? 0}
              onChange={(e) => set("silence_days", Number(e.target.value))} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="flex items-center gap-1"><Moon size={12} /> Quiet from</Label>
              <Input type="time" value={form?.quiet_start ?? "22:00"} onChange={(e) => set("quiet_start", e.target.value)} />
            </div>
            <div>
              <Label>until</Label>
              <Input type="time" value={form?.quiet_end ?? "06:30"} onChange={(e) => set("quiet_end", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={!form || save.isPending} className="rounded-full">
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
          <Button variant="outline" className="rounded-full" disabled={trigger.isPending}
            onClick={() => trigger.mutate("dry-run")}>
            Dry run (no writes)
          </Button>
          <Button variant="outline" className="rounded-full" disabled={trigger.isPending}
            onClick={() => trigger.mutate("score")}>
            <Play size={14} className="mr-1" /> Score now
          </Button>
          <Button variant="outline" className="rounded-full" disabled={trigger.isPending}
            onClick={() => trigger.mutate("nudge")}>
            Send nudges now
          </Button>
        </div>
        {trigger.data && (
          <pre className="max-h-40 overflow-auto rounded-lg bg-paper/60 p-3 text-[11px] text-muted-foreground">
            {typeof trigger.data.result === "string" ? trigger.data.result : JSON.stringify(trigger.data.result, null, 2)}
          </pre>
        )}
      </section>

      <section className="soft-card p-5">
        <h2 className="mb-3 text-sm font-medium">Nudges delivered</h2>
        <ul className="space-y-2">
          {nudges.map((n) => (
            <li key={n.id} className="rounded-lg bg-paper/40 p-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{n.name}</span>
                <span>{new Date(n.created_at).toLocaleString()} · {n.seen_at ? "seen" : "unseen"}</span>
              </div>
              <div>{n.body}</div>
            </li>
          ))}
          {nudges.length === 0 && <div className="text-xs text-muted-foreground">No nudges yet.</div>}
        </ul>
      </section>

      <section className="soft-card p-5">
        <h2 className="mb-3 text-sm font-medium">Event log</h2>
        <ul className="space-y-1">
          {events.map((e: any) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg bg-paper/40 px-3 py-2 text-xs">
              <span className="font-medium text-foreground">{e.event_type}</span>
              <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
            </li>
          ))}
          {events.length === 0 && <div className="text-xs text-muted-foreground">Quiet so far.</div>}
        </ul>
      </section>
    </div>
  );
}
