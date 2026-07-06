import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/mentors")({ component: AdminMentors });

function AdminMentors() {
  const qc = useQueryClient();
  const [f, setF] = useState({ profile_id: "", bio: "", specialties: "" });
  const [slot, setSlot] = useState({ mentor_id: "", start: "", end: "" });

  const { data } = useQuery({
    queryKey: ["adm-mentors"],
    queryFn: async () => {
      const [m, avail, book, profs] = await Promise.all([
        supabase.from("mentors").select("*, profiles(full_name)"),
        supabase.from("mentor_availability").select("*").order("slot_start"),
        supabase.from("bookings").select("*, profiles(full_name)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name"),
      ]);
      return { mentors: m.data ?? [], avail: avail.data ?? [], bookings: book.data ?? [], profiles: profs.data ?? [] };
    },
  });

  const addMentor = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentors").insert({ profile_id: f.profile_id, bio: f.bio, specialties: f.specialties.split(",").map((s) => s.trim()).filter(Boolean) });
      if (error) throw error;
      // grant mentor role
      await supabase.from("user_roles").insert({ user_id: f.profile_id, role: "mentor" });
    },
    onSuccess: () => { toast.success("Added"); qc.invalidateQueries({ queryKey: ["adm-mentors"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const addSlot = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentor_availability").insert({ mentor_id: slot.mentor_id, slot_start: new Date(slot.start).toISOString(), slot_end: new Date(slot.end).toISOString() });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Slot added"); qc.invalidateQueries({ queryKey: ["adm-mentors"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-semibold">Mentors</h1>
      <Card><CardContent className="p-5 space-y-3">
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>Profile (user id)</Label><Input value={f.profile_id} onChange={(e) => setF({ ...f, profile_id: e.target.value })} placeholder="paste user UUID" /></div>
          <div><Label>Specialties (comma)</Label><Input value={f.specialties} onChange={(e) => setF({ ...f, specialties: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Bio</Label><Textarea value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></div>
        </div>
        <Button onClick={() => addMentor.mutate()} disabled={!f.profile_id}>Add mentor</Button>
      </CardContent></Card>

      <Card><CardContent className="p-5 space-y-3">
        <div className="font-medium">Add availability slot</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div><Label>Mentor</Label>
            <select className="border rounded-lg h-10 px-3 w-full bg-background" value={slot.mentor_id} onChange={(e) => setSlot({ ...slot, mentor_id: e.target.value })}>
              <option value="">Select</option>
              {data?.mentors.map((m) => <option key={m.id} value={m.id}>{(m as any).profiles?.full_name || m.id}</option>)}
            </select>
          </div>
          <div><Label>Start</Label><Input type="datetime-local" value={slot.start} onChange={(e) => setSlot({ ...slot, start: e.target.value })} /></div>
          <div><Label>End</Label><Input type="datetime-local" value={slot.end} onChange={(e) => setSlot({ ...slot, end: e.target.value })} /></div>
        </div>
        <Button onClick={() => addSlot.mutate()} disabled={!slot.mentor_id || !slot.start || !slot.end}>Add slot</Button>
      </CardContent></Card>

      <div className="grid md:grid-cols-2 gap-3">
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Mentors</div>
          {data?.mentors.map((m) => (<div key={m.id} className="text-sm border-b py-2">{(m as any).profiles?.full_name} — {(m.specialties ?? []).join(", ")}</div>))}
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="text-sm font-medium mb-2">Recent bookings</div>
          {data?.bookings.slice(0, 10).map((b) => (
            <div key={b.id} className="text-sm border-b py-2 flex justify-between">
              <span>{(b as any).profiles?.full_name ?? "—"}</span>
              <span className="text-muted-foreground">{b.status} · {format(new Date(b.created_at), "d MMM")}</span>
            </div>
          ))}
        </CardContent></Card>
      </div>
    </div>
  );
}
