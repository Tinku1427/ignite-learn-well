import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/agent")({
  component: () => <Protected mode="admin" staffOnly><Agent /></Protected>,
});

function Agent() {
  const { data: events = [] } = useQuery({
    queryKey: ["admin-agent-events"],
    queryFn: async () => (await supabase.from("agent_events").select("id, user_id, event_type, detail, created_at").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const { data: nudges = [] } = useQuery({
    queryKey: ["admin-agent-nudges"],
    queryFn: async () => (await supabase.from("nudges").select("id, user_id, body, tone, created_at, seen_at").order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Admin · Agent</div>
        <h1 className="font-display text-3xl">Wellness Agent activity</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-lg">Every automated nudge and score event. Nightly agent goes live in the backend batch.</p>
      </header>

      <section className="soft-card p-5">
        <h2 className="text-sm font-medium mb-3">Recent nudges</h2>
        <ul className="space-y-2">
          {nudges.map((n: any) => (
            <li key={n.id} className="rounded-lg bg-paper/40 p-3 text-sm">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{n.tone ?? "warm"}</span>
                <span>{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <div>{n.body}</div>
            </li>
          ))}
          {nudges.length === 0 && <div className="text-xs text-muted-foreground">No nudges yet.</div>}
        </ul>
      </section>

      <section className="soft-card p-5">
        <h2 className="text-sm font-medium mb-3">Event log</h2>
        <ul className="space-y-1">
          {events.map((e: any) => (
            <li key={e.id} className="flex items-center justify-between text-xs rounded-lg bg-paper/40 px-3 py-2">
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
