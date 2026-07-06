import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { celebrate } from "@/lib/celebrate";
import { Mascot } from "@/components/mascot";
import { format } from "date-fns";
import { Lock, Share2 } from "lucide-react";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Journal — Guiding Mentor" }] }),
  component: () => <Protected><Journal /></Protected>,
});

const PRIVATE = "__private__";

function Journal() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [body, setBody] = useState("");
  const [shareWith, setShareWith] = useState<string>(PRIVATE);

  const { data: entries } = useQuery({
    queryKey: ["journal", uid],
    queryFn: async () => (await supabase.from("journal_entries").select("*").eq("user_id", uid!).order("entry_date", { ascending: false }).limit(30)).data ?? [],
    enabled: !!uid,
  });

  // Mentors the student is actually connected to (has bookings with)
  const { data: myMentors } = useQuery({
    queryKey: ["my-mentors", uid],
    queryFn: async () => {
      const { data: bookings } = await supabase.from("bookings").select("mentor_id").eq("student_id", uid!);
      const ids = Array.from(new Set((bookings ?? []).map((b) => b.mentor_id)));
      if (!ids.length) return [];
      const { data: mentors } = await supabase.from("mentors").select("id, profiles!inner(full_name)").in("id", ids);
      return (mentors ?? []) as Array<{ id: string; profiles: { full_name: string } }>;
    },
    enabled: !!uid,
  });

  const todayEntry = entries?.find((e) => e.entry_date === today);

  const save = useMutation({
    mutationFn: async () => {
      const shared = shareWith === PRIVATE ? null : shareWith;
      const payload = { body, flag_for_mentor: !!shared, shared_with_mentor_id: shared };
      if (todayEntry) {
        const { error } = await supabase.from("journal_entries").update(payload).eq("id", todayEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("journal_entries").insert({ user_id: uid!, entry_date: today, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      celebrate(todayEntry ? "Updated — thanks for showing up." : "That's today's entry in the books.");
      setBody(""); setShareWith(PRIVATE);
      qc.invalidateQueries({ queryKey: ["journal", uid] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hasMentors = (myMentors?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Mascot mood="encouraging" size={64} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">Daily journal</h1>
          <p className="text-muted-foreground text-sm">Private by default. One line counts. Share any single entry with a mentor if you want a second pair of eyes.</p>
        </div>
      </div>

      <Card><CardContent className="p-5 space-y-3">
        <div className="text-sm text-muted-foreground">Today: {format(new Date(), "EEEE, d MMM")}</div>
        <div className="text-sm">How did today go? One thing that stressed you, one thing that went well.</div>
        <Textarea rows={6} value={body || todayEntry?.body || ""} onChange={(e) => setBody(e.target.value)} placeholder="Write freely…" />

        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Share this entry</div>
          {hasMentors ? (
            <Select value={shareWith} onValueChange={setShareWith}>
              <SelectTrigger className="w-full sm:w-80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PRIVATE}>
                  <span className="inline-flex items-center gap-2"><Lock className="size-3" /> Keep private</span>
                </SelectItem>
                {myMentors!.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="inline-flex items-center gap-2"><Share2 className="size-3" /> Share with {m.profiles.full_name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="size-3" /> Sharing unlocks once you've booked a mentor.
              <Link to="/mentors" className="underline">Find a mentor</Link>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Sharing is per entry — the next one stays private unless you choose to share it.</p>
        </div>

        <Button onClick={() => save.mutate()} disabled={save.isPending || !(body || todayEntry?.body)}>Save entry</Button>
      </CardContent></Card>

      <div>
        <div className="text-sm font-medium mb-2">Recent entries</div>
        <div className="space-y-2">
          {entries?.filter((e) => e.entry_date !== today).map((e: any) => (
            <Card key={e.id}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                <span>{format(new Date(e.entry_date), "d MMM yyyy")}</span>
                {e.shared_with_mentor_id ? (
                  <span className="inline-flex items-center gap-1 text-primary"><Share2 className="size-3" /> Shared</span>
                ) : (
                  <span className="inline-flex items-center gap-1"><Lock className="size-3" /> Private</span>
                )}
              </div>
              <div className="text-sm whitespace-pre-wrap">{e.body}</div>
            </CardContent></Card>
          ))}
          {!entries?.length && <div className="text-sm text-muted-foreground">No entries yet.</div>}
        </div>
      </div>
    </div>
  );
}
