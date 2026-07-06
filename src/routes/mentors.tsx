import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/mentors")({
  head: () => ({ meta: [{ title: "Mentors — Guiding Mentor" }] }),
  component: () => <Protected><Mentors /></Protected>,
});

function Mentors() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const [openMentor, setOpenMentor] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const { data } = useQuery({
    queryKey: ["mentors-panel", uid],
    queryFn: async () => {
      const [m, avail, bookings, msgs] = await Promise.all([
        supabase.from("mentors").select("*, profiles!inner(full_name)").eq("active", true),
        supabase.from("mentor_availability").select("*").eq("booked", false).gte("slot_start", new Date().toISOString()).order("slot_start"),
        supabase.from("bookings").select("*").eq("student_id", uid!).order("created_at", { ascending: false }),
        supabase.from("mentor_messages").select("*").eq("student_id", uid!).order("created_at"),
      ]);
      return { mentors: m.data ?? [], avail: avail.data ?? [], bookings: bookings.data ?? [], msgs: msgs.data ?? [] };
    },
    enabled: !!uid,
  });

  const book = useMutation({
    mutationFn: async ({ mentorId, availId }: { mentorId: string; availId: string }) => {
      await supabase.from("mentor_availability").update({ booked: true }).eq("id", availId);
      const { error } = await supabase.from("bookings").insert({ student_id: uid!, mentor_id: mentorId, availability_id: availId, status: "requested" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Session requested"); qc.invalidateQueries({ queryKey: ["mentors-panel", uid] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const send = useMutation({
    mutationFn: async () => {
      if (!openMentor || !msg.trim()) return;
      const { error } = await supabase.from("mentor_messages").insert({ student_id: uid!, mentor_id: openMentor, sender_id: uid!, body: msg });
      if (error) throw error;
    },
    onSuccess: () => { setMsg(""); qc.invalidateQueries({ queryKey: ["mentors-panel", uid] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Mentors & counsellors</h1>
        <p className="text-muted-foreground text-sm">Book a 1:1 or send a quick message.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {data?.mentors.map((m) => {
          const slots = data.avail.filter((a) => a.mentor_id === m.id).slice(0, 4);
          const thread = data.msgs.filter((x) => x.mentor_id === m.id);
          return (
            <Card key={m.id}><CardContent className="p-5 space-y-3">
              <div>
                <div className="font-medium">{(m as any).profiles?.full_name || "Mentor"}</div>
                <div className="text-xs text-muted-foreground">{(m.specialties ?? []).join(" · ")}</div>
                {m.bio && <div className="text-sm text-muted-foreground mt-1">{m.bio}</div>}
              </div>
              <div>
                <div className="text-xs font-medium mb-1">Next slots</div>
                <div className="flex flex-wrap gap-2">
                  {slots.length === 0 && <div className="text-xs text-muted-foreground">No slots available</div>}
                  {slots.map((s) => (
                    <Button key={s.id} size="sm" variant="outline" onClick={() => book.mutate({ mentorId: m.id, availId: s.id })}>
                      {format(new Date(s.slot_start), "d MMM, HH:mm")}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Button size="sm" variant="ghost" onClick={() => setOpenMentor(openMentor === m.id ? null : m.id)}>
                  {openMentor === m.id ? "Close chat" : "Open chat"}
                </Button>
                {openMentor === m.id && (
                  <div className="mt-2 space-y-2">
                    <div className="rounded-lg border p-2 max-h-40 overflow-y-auto space-y-1 bg-secondary/40">
                      {thread.length === 0 && <div className="text-xs text-muted-foreground">No messages yet.</div>}
                      {thread.map((t) => (
                        <div key={t.id} className={`text-sm ${t.sender_id === uid ? "text-right" : ""}`}>
                          <span className={`inline-block rounded-lg px-2 py-1 ${t.sender_id === uid ? "bg-primary text-primary-foreground" : "bg-background"}`}>{t.body}</span>
                        </div>
                      ))}
                    </div>
                    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
                      <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message…" />
                      <Button size="sm" type="submit">Send</Button>
                    </form>
                  </div>
                )}
              </div>
            </CardContent></Card>
          );
        })}
        {!data?.mentors.length && <Card><CardContent className="p-8 text-center text-muted-foreground">No mentors available yet.</CardContent></Card>}
      </div>

      {data?.bookings?.length ? (
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Your bookings</div>
          <div className="space-y-1 text-sm">
            {data.bookings.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span>Booking #{b.id.slice(0, 6)}</span>
                <span className="text-muted-foreground">{b.status}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      ) : null}
    </div>
  );
}
