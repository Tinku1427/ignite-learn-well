import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarDays, MessageCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/mentors")({
  head: () => ({ meta: [{ title: "Mentors & counsellors — Guiding Mentor" }] }),
  component: () => <Protected><Mentors /></Protected>,
});

// DiceBear "personas" is a flat-illustration human avatar style — royalty free.
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear`;

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
    onSuccess: () => { toast.success("Session requested — the mentor will confirm soon."); qc.invalidateQueries({ queryKey: ["mentors-panel", uid] }); },
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
        <p className="text-muted-foreground text-sm">Real people who've helped hundreds of students through what you're feeling. Pick who feels right — book a 1:1 or send a message first.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {data?.mentors.map((m: any) => {
          const slots = data.avail.filter((a) => a.mentor_id === m.id).slice(0, 4);
          const thread = data.msgs.filter((x) => x.mentor_id === m.id);
          const name = m.profiles?.full_name || "Mentor";
          const seed = m.avatar_seed || m.id;
          return (
            <Card key={m.id} className="overflow-hidden">
              <div className="h-16 gradient-calm" />
              <CardContent className="p-5 -mt-10 space-y-4">
                <div className="flex items-end gap-3">
                  <Avatar className="size-20 ring-4 ring-background bg-background">
                    <AvatarImage src={avatarUrl(seed)} alt={name} />
                    <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="pb-2">
                    <div className="font-medium leading-tight">{name}</div>
                    <div className="text-xs text-muted-foreground">Counsellor & mentor</div>
                  </div>
                </div>

                {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}

                {(m.specialties ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(m.specialties ?? []).map((s: string) => (
                      <Badge key={s} variant="secondary" className="gap-1"><Sparkles className="size-3" />{s}</Badge>
                    ))}
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium mb-2 flex items-center gap-1"><CalendarDays className="size-3" /> Next slots</div>
                  <div className="flex flex-wrap gap-2">
                    {slots.length === 0 && <div className="text-xs text-muted-foreground">No slots right now — send a message instead.</div>}
                    {slots.map((s) => (
                      <Button key={s.id} size="sm" variant="outline" onClick={() => book.mutate({ mentorId: m.id, availId: s.id })}>
                        {format(new Date(s.slot_start), "d MMM, HH:mm")}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <Button size="sm" variant="ghost" className="gap-2" onClick={() => setOpenMentor(openMentor === m.id ? null : m.id)}>
                    <MessageCircle className="size-4" /> {openMentor === m.id ? "Close chat" : "Message " + name.split(" ")[0]}
                  </Button>
                  {openMentor === m.id && (
                    <div className="mt-2 space-y-2">
                      <div className="rounded-lg border p-2 max-h-40 overflow-y-auto space-y-1 bg-secondary/40">
                        {thread.length === 0 && <div className="text-xs text-muted-foreground">Say hi — mentors reply within a day.</div>}
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
              </CardContent>
            </Card>
          );
        })}
        {!data?.mentors.length && <Card><CardContent className="p-8 text-center text-muted-foreground">No mentors available yet.</CardContent></Card>}
      </div>

      {data?.bookings?.length ? (
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Your sessions</div>
          <div className="space-y-1 text-sm">
            {data.bookings.map((b) => (
              <div key={b.id} className="flex justify-between">
                <span>Session #{b.id.slice(0, 6)}</span>
                <span className="text-muted-foreground">{b.status}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      ) : null}
    </div>
  );
}
