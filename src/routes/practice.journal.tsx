import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Lock, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Scene } from "@/components/scene";

export const Route = createFileRoute("/practice/journal")({ component: Journal });

type Entry = {
  id: string; entry_date: string; body: string;
  is_private: boolean; shared_with_mentor_id: string | null; created_at: string;
};
type Mentor = { id: string; display_name: string };

const PROMPTS = [
  "What's the loudest thing in your head right now?",
  "One small thing that went well today.",
  "If today had a title, what would it be?",
  "Where did you feel it in your body?",
  "What are you carrying that isn't yours to carry?",
];

function Journal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [share, setShare] = useState(false);
  const [mentorId, setMentorId] = useState<string>("");
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const { data: entries = [] } = useQuery({
    enabled: !!user,
    queryKey: ["journal", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_entries")
        .select("id,entry_date,body,is_private,shared_with_mentor_id,created_at")
        .eq("user_id", user!.id).order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data as Entry[];
    },
  });

  const { data: mentors = [] } = useQuery({
    queryKey: ["mentors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentors")
        .select("id, profile:profiles!mentors_profile_id_fkey(full_name)")
        .eq("active", true);
      if (error) throw error;
      return (data ?? []).map((m: { id: string; profile: { full_name: string } | null }) => ({
        id: m.id,
        display_name: m.profile?.full_name ?? "Mentor",
      })) as Mentor[];
    },
  });


  const save = useMutation({
    mutationFn: async () => {
      if (!user || !body.trim()) return;
      const { error } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        body: body.trim(),
        is_private: !share,
        shared_with_mentor_id: share && mentorId ? mentorId : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setBody(""); setShare(false); setMentorId("");
      toast.success("Kept safe. Yours alone unless you shared it.");
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal"] }),
  });

  return (
    <div className="space-y-6">
      <div className="soft-card p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Prompt</div>
            <div className="mt-1 font-display text-xl">{prompt}</div>
          </div>
          <Scene kind="journal" size={72} className="shrink-0" />
        </div>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Three lines is enough."
          className="mt-4 min-h-[140px] resize-y bg-paper/60 text-base leading-relaxed"
        />

        <div className="mt-4 rounded-2xl bg-secondary/50 p-3">
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} className="mt-1" />
            <span>
              <span className="font-medium">Share this entry with a mentor</span>
              <span className="ml-1 text-xs text-muted-foreground">— everything else stays in your vault.</span>
            </span>
          </label>
          {share && (
            <select
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="">Choose a mentor…</option>
              {mentors.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
            </select>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3.5" /> End-to-end private by default
          </div>
          <Button
            onClick={() => save.mutate()}
            disabled={!body.trim() || save.isPending || (share && !mentorId)}
            className="rounded-full"
          >
            {save.isPending ? "Saving…" : "Keep this"}
          </Button>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">Your vault</h3>
        {entries.length === 0 && (
          <div className="soft-card p-6 text-center text-sm text-muted-foreground">
            Nothing yet. The first entry is always the hardest.
          </div>
        )}
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className={cn("soft-card p-4", !e.is_private && "ring-1 ring-apricot/30")}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(e.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                <span className="inline-flex items-center gap-1">
                  {e.is_private ? <><Lock className="size-3" /> Private</> : <><Share2 className="size-3" /> Shared</>}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{e.body}</p>
              <div className="mt-3 text-right">
                <button onClick={() => remove.mutate(e.id)} className="text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="mr-1 inline size-3" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
