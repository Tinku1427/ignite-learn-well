import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminListUsers } from "@/lib/admin-users.functions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Megaphone, Users, GraduationCap, HeartHandshake, UserRound, Layers } from "lucide-react";

export const Route = createFileRoute("/admin/announcements")({
  component: () => <><Messaging /></>,
});

type Audience = "everyone" | "students" | "mentors" | "coaches" | "cohort" | "person";

const AUDIENCES: { key: Audience; label: string; hint: string; icon: any }[] = [
  { key: "everyone", label: "Everyone",    hint: "Every account on the platform", icon: Megaphone },
  { key: "students", label: "All students", hint: "Students only",                icon: GraduationCap },
  { key: "mentors",  label: "All mentors",  hint: "Mentors only",                 icon: HeartHandshake },
  { key: "coaches",  label: "All coaches",  hint: "Coaches & counsellors",        icon: Users },
  { key: "cohort",   label: "One cohort",   hint: "Students in a single cohort",  icon: Layers },
  { key: "person",   label: "One person",   hint: "A private direct message",     icon: UserRound },
];

function Messaging() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const listUsers = useServerFn(adminListUsers);

  const [audience, setAudience] = useState<Audience>("everyone");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [search, setSearch] = useState("");
  const [personId, setPersonId] = useState("");

  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => (await supabase.from("cohorts").select("id, name").order("name")).data ?? [],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listUsers(),
  });

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return users
      .filter((u) => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .slice(0, 8);
  }, [search, users]);

  const person = users.find((u) => u.id === personId);

  const { data: broadcasts = [] } = useQuery({
    queryKey: ["admin-broadcasts"],
    queryFn: async () =>
      (await supabase.from("announcements")
        .select("id, title, body, audience, cohort_id, active, created_at")
        .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const { data: sentDms = [] } = useQuery({
    queryKey: ["admin-dms"],
    queryFn: async () =>
      (await supabase.from("direct_messages")
        .select("id, recipient_id, title, body, created_at, read_at")
        .order("created_at", { ascending: false }).limit(50)).data ?? [],
  });

  const nameOf = (id: string) => users.find((u) => u.id === id)?.full_name || users.find((u) => u.id === id)?.email || "Someone";

  const send = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (audience === "person") {
        if (!personId) throw new Error("Pick a person first");
        const { error } = await supabase.from("direct_messages").insert({
          recipient_id: personId, sender_id: user.id, title: title.trim(), body: body.trim(),
        });
        if (error) throw error;
        return "direct";
      }
      if (audience === "cohort" && !cohortId) throw new Error("Pick a cohort first");
      const { error } = await supabase.from("announcements").insert({
        title: title.trim(),
        body: body.trim(),
        audience,
        cohort_id: audience === "cohort" ? cohortId : null,
        created_by: user.id,
        active: true,
        starts_at: new Date().toISOString(),
      });
      if (error) throw error;
      return "broadcast";
    },
    onSuccess: (kind) => {
      toast.success(kind === "direct" ? "Message delivered." : "Announcement is live.");
      setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["admin-broadcasts"] });
      qc.invalidateQueries({ queryKey: ["admin-dms"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not send"),
  });

  const toggle = useMutation({
    mutationFn: async (r: any) => {
      const { error } = await supabase.from("announcements").update({ active: !r.active }).eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-broadcasts"] }),
    onError: (e: any) => toast.error(e?.message ?? "Failed"),
  });

  const audienceLabel = (a: string, cid: string | null) =>
    a === "cohort" ? `Cohort · ${cohorts.find((c: any) => c.id === cid)?.name ?? "unknown"}`
      : AUDIENCES.find((x) => x.key === a)?.label ?? a;

  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Megaphone size={14} /> Admin · Messaging
        </div>
        <h1 className="font-display text-3xl">Reach anyone, from one place</h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          Broadcast to a whole role or cohort, or send one person a private message. It lands in their panel — and nowhere else.
        </p>
      </header>

      <section className="soft-card max-w-2xl space-y-4 p-5">
        <div>
          <Label className="mb-2 block">Audience</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              const active = audience === a.key;
              return (
                <button key={a.key} type="button" onClick={() => setAudience(a.key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-xl border p-3 text-left motion-safe:transition-all",
                    active
                      ? "border-primary bg-secondary ring-2 ring-primary/50 motion-safe:scale-[1.02]"
                      : "border-border hover:bg-secondary/40 opacity-90",
                  )}>
                  <div className="flex items-center gap-2 text-sm font-medium"><Icon size={15} /> {a.label}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">{a.hint}</div>
                </button>
              );
            })}
          </div>
        </div>

        {audience === "cohort" && (
          <div>
            <Label>Cohort</Label>
            <select value={cohortId} onChange={(e) => setCohortId(e.target.value)}
              className="w-full rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm">
              <option value="">Choose a cohort…</option>
              {cohorts.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {audience === "person" && (
          <div>
            <Label htmlFor="who">Person (name or email)</Label>
            <Input id="who" value={search} onChange={(e) => { setSearch(e.target.value); setPersonId(""); }}
              placeholder="Start typing a name or email…" />
            {person && (
              <div className="mt-2 rounded-lg border border-primary/40 bg-secondary px-3 py-2 text-sm">
                Sending to <b>{person.full_name || person.email}</b>
                <span className="ml-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  {person.roles.join(" · ") || "no role"}
                </span>
              </div>
            )}
            {!person && matches.length > 0 && (
              <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border">
                {matches.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => { setPersonId(m.id); setSearch(m.full_name || m.email); }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-secondary/50">
                      <span>{m.full_name || "—"} <span className="text-muted-foreground">{m.email}</span></span>
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.roles.join(" · ")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="t">Title</Label>
          <Input id="t" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Live session moved to 7pm" />
        </div>
        <div>
          <Label htmlFor="b">Message</Label>
          <textarea id="b" rows={4} value={body} onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-border bg-paper/60 px-3 py-2 text-sm"
            placeholder="Keep it warm and short." />
        </div>

        <Button
          onClick={() => send.mutate()}
          disabled={!title.trim() || !body.trim() || send.isPending || (audience === "person" && !personId) || (audience === "cohort" && !cohortId)}
          className="rounded-full">
          {send.isPending ? "Sending…" : audience === "person" ? "Send private message" : "Publish announcement"}
        </Button>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Broadcasts</h2>
        <ul className="space-y-2">
          {broadcasts.map((r: any) => (
            <li key={r.id} className="soft-card flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <div className="font-medium">{r.title}</div>
                <div className="line-clamp-2 max-w-lg text-xs text-muted-foreground">{r.body}</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {audienceLabel(r.audience ?? "everyone", r.cohort_id)} · {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
              <Button size="sm" variant="outline" className="shrink-0 rounded-full" onClick={() => toggle.mutate(r)}>
                {r.active ? "Deactivate" : "Activate"}
              </Button>
            </li>
          ))}
          {broadcasts.length === 0 && <div className="soft-card p-5 text-sm text-muted-foreground">Nothing sent yet.</div>}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Direct messages</h2>
        <ul className="space-y-2">
          {sentDms.map((d: any) => (
            <li key={d.id} className="soft-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium">{d.title}</div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {d.read_at ? "read" : "unread"}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">To {nameOf(d.recipient_id)} · {new Date(d.created_at).toLocaleString()}</div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.body}</p>
            </li>
          ))}
          {sentDms.length === 0 && <div className="soft-card p-5 text-sm text-muted-foreground">No direct messages yet.</div>}
        </ul>
      </section>
    </div>
  );
}
