import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/journal")({
  head: () => ({ meta: [{ title: "Journal — Guiding Mentor" }] }),
  component: () => <Protected><Journal /></Protected>,
});

function Journal() {
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [body, setBody] = useState("");
  const [flag, setFlag] = useState(false);

  const { data: entries } = useQuery({
    queryKey: ["journal", uid],
    queryFn: async () => (await supabase.from("journal_entries").select("*").eq("user_id", uid!).order("entry_date", { ascending: false }).limit(30)).data ?? [],
    enabled: !!uid,
  });

  const todayEntry = entries?.find((e) => e.entry_date === today);

  const save = useMutation({
    mutationFn: async () => {
      if (todayEntry) {
        const { error } = await supabase.from("journal_entries").update({ body, flag_for_mentor: flag }).eq("id", todayEntry.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("journal_entries").insert({ user_id: uid!, body, entry_date: today, flag_for_mentor: flag });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Saved"); setBody(""); setFlag(false); qc.invalidateQueries({ queryKey: ["journal", uid] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Daily journal</h1>
        <p className="text-muted-foreground text-sm">Private by default. Flag any entry if you'd like a mentor to see it.</p>
      </div>
      <Card><CardContent className="p-5 space-y-3">
        <div className="text-sm text-muted-foreground">Today: {format(new Date(), "EEEE, d MMM")}</div>
        <div className="text-sm">How did today go? One thing that stressed you, one thing that went well.</div>
        <Textarea rows={6} value={body || todayEntry?.body || ""} onChange={(e) => setBody(e.target.value)} placeholder="Write freely…" />
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={flag} onCheckedChange={(v) => setFlag(!!v)} /> Share this entry with my mentor
        </label>
        <Button onClick={() => save.mutate()} disabled={save.isPending || !(body || todayEntry?.body)}>Save entry</Button>
      </CardContent></Card>

      <div>
        <div className="text-sm font-medium mb-2">Recent entries</div>
        <div className="space-y-2">
          {entries?.filter((e) => e.entry_date !== today).map((e) => (
            <Card key={e.id}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{format(new Date(e.entry_date), "d MMM yyyy")}</div>
              <div className="text-sm whitespace-pre-wrap">{e.body}</div>
            </CardContent></Card>
          ))}
          {!entries?.length && <div className="text-sm text-muted-foreground">No entries yet.</div>}
        </div>
      </div>
    </div>
  );
}
