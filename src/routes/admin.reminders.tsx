import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/reminders")({ component: AdminReminders });

function AdminReminders() {
  const qc = useQueryClient();
  const [f, setF] = useState({ activity: "journal", time_of_day: "20:00", template: "", channel: "whatsapp" });
  const [manual, setManual] = useState({ user_id: "", message: "" });

  const { data } = useQuery({
    queryKey: ["adm-rem"],
    queryFn: async () => {
      const [rules, log] = await Promise.all([
        supabase.from("reminder_rules").select("*").order("created_at"),
        supabase.from("reminder_log").select("*, profiles(full_name)").order("created_at", { ascending: false }).limit(50),
      ]);
      return { rules: rules.data ?? [], log: log.data ?? [] };
    },
  });

  const addRule = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("reminder_rules").insert(f as any); if (error) throw error; },
    onSuccess: () => { toast.success("Rule added"); qc.invalidateQueries({ queryKey: ["adm-rem"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => { await supabase.from("reminder_rules").update({ active }).eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adm-rem"] }),
  });

  const sendManual = useMutation({
    mutationFn: async () => {
      // Stubbed WhatsApp send — logs as 'stubbed' with message
      const { error } = await supabase.from("reminder_log").insert({ user_id: manual.user_id, channel: "whatsapp", status: "stubbed", message: manual.message });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Message queued (stubbed — WhatsApp provider not connected)"); setManual({ user_id: "", message: "" }); qc.invalidateQueries({ queryKey: ["adm-rem"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Reminders & nudges</h1>
      <div className="rounded-lg border border-warm/40 bg-warm/10 p-3 text-sm">
        WhatsApp sending is stubbed for v1 — messages are logged as <Badge variant="secondary">stubbed</Badge> and shown in the log below. Connect a provider (Twilio / Meta / GatewayAPI) to enable real sending.
      </div>

      <Card><CardContent className="p-5 space-y-3">
        <div className="font-medium">Add rule</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Activity</Label><Input value={f.activity} onChange={(e) => setF({ ...f, activity: e.target.value })} placeholder="journal / meditation / study_goal" /></div>
          <div><Label>Time</Label><Input type="time" value={f.time_of_day} onChange={(e) => setF({ ...f, time_of_day: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Template</Label><Textarea value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })} placeholder="Hi {name}, …" /></div>
        </div>
        <Button onClick={() => addRule.mutate()} disabled={!f.activity || !f.template}>Add rule</Button>
      </CardContent></Card>

      <div className="grid md:grid-cols-2 gap-3">
        {data?.rules.map((r) => (
          <Card key={r.id}><CardContent className="p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-medium">{r.activity} — {r.time_of_day}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.template}</div>
                <Badge variant="secondary" className="mt-2">{r.channel}</Badge>
              </div>
              <Switch checked={r.active} onCheckedChange={(v) => toggleRule.mutate({ id: r.id, active: v })} />
            </div>
          </CardContent></Card>
        ))}
      </div>

      <Card><CardContent className="p-5 space-y-3">
        <div className="font-medium">Send one-off message (stubbed)</div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Student user id</Label><Input value={manual.user_id} onChange={(e) => setManual({ ...manual, user_id: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Message</Label><Textarea value={manual.message} onChange={(e) => setManual({ ...manual, message: e.target.value })} /></div>
        </div>
        <Button onClick={() => sendManual.mutate()} disabled={!manual.user_id || !manual.message}>Queue send</Button>
      </CardContent></Card>

      <Card><CardContent className="p-5">
        <div className="text-sm font-medium mb-2">Delivery log</div>
        <div className="space-y-1 text-sm">
          {data?.log.map((l) => (
            <div key={l.id} className="flex justify-between border-b py-1">
              <span className="truncate">{(l as any).profiles?.full_name ?? l.user_id.slice(0, 8)} — {l.message?.slice(0, 60) ?? "(rule)"}</span>
              <span className="text-muted-foreground">{l.status} · {format(new Date(l.created_at), "d MMM HH:mm")}</span>
            </div>
          ))}
          {!data?.log.length && <div className="text-muted-foreground">No messages yet.</div>}
        </div>
      </CardContent></Card>
    </div>
  );
}
