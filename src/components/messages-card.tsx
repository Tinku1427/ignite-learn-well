import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Megaphone, Mail } from "lucide-react";

type Item = {
  key: string;
  kind: "broadcast" | "direct";
  id: string;
  title: string;
  body: string;
  created_at: string;
  unread: boolean;
};

/**
 * One inbox, shared by students, mentors and coaches.
 * Row-level security decides what lands here: broadcasts match the audience the
 * admin chose, direct messages match the recipient. Nothing else is visible.
 */
export function MessagesCard({ className, title = "Messages" }: { className?: string; title?: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: announcements = [] } = useQuery({
    enabled: !!user,
    queryKey: ["inbox-announcements", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcements")
        .select("id, title, body, audience, created_at, active")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const { data: reads = [] } = useQuery({
    enabled: !!user,
    queryKey: ["inbox-reads", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("announcement_reads")
        .select("announcement_id, read_at, dismissed_at")
        .eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const { data: dms = [] } = useQuery({
    enabled: !!user,
    queryKey: ["inbox-dms", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("direct_messages")
        .select("id, title, body, created_at, read_at, dismissed_at")
        .eq("recipient_id", user!.id)
        .is("dismissed_at", null)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const items = useMemo<Item[]>(() => {
    const readMap = new Map(reads.map((r) => [r.announcement_id, r]));
    const broadcast: Item[] = announcements
      .filter((a) => !readMap.get(a.id)?.dismissed_at)
      .map((a) => ({
        key: `a-${a.id}`, kind: "broadcast" as const, id: a.id,
        title: a.title, body: a.body ?? "", created_at: a.created_at,
        unread: !readMap.get(a.id)?.read_at,
      }));
    const direct: Item[] = dms.map((d) => ({
      key: `d-${d.id}`, kind: "direct" as const, id: d.id,
      title: d.title, body: d.body, created_at: d.created_at,
      unread: !d.read_at,
    }));
    return [...direct, ...broadcast].sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [announcements, reads, dms]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["inbox-reads"] });
    qc.invalidateQueries({ queryKey: ["inbox-dms"] });
  };

  const mark = useMutation({
    mutationFn: async ({ item, dismiss }: { item: Item; dismiss: boolean }) => {
      if (!user) return;
      const now = new Date().toISOString();
      if (item.kind === "direct") {
        await supabase.from("direct_messages")
          .update(dismiss ? { read_at: now, dismissed_at: now } : { read_at: now })
          .eq("id", item.id);
      } else {
        await supabase.from("announcement_reads").upsert(
          { announcement_id: item.id, user_id: user.id, read_at: now, dismissed_at: dismiss ? now : null },
          { onConflict: "announcement_id,user_id" },
        );
      }
    },
    onSuccess: refresh,
  });

  const unread = items.filter((i) => i.unread).length;
  if (!user) return null;

  return (
    <section className={cn("soft-card p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Megaphone size={16} /> {title}
        </h2>
        {unread > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
            {unread} new
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing new. You're all caught up.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.slice(0, 8).map((i) => (
            <li key={i.key} className={cn(
              "rounded-xl border p-3",
              i.unread ? "border-primary/40 bg-secondary/60" : "border-border bg-paper/40",
            )}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {i.unread && <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />}
                    <span className="truncate text-sm font-medium">{i.title}</span>
                    {i.kind === "direct" && (
                      <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                        <Mail size={10} /> direct
                      </span>
                    )}
                  </div>
                  {i.body && <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{i.body}</p>}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {new Date(i.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {i.unread && (
                    <Button size="sm" variant="outline" className="h-7 rounded-full px-3 text-xs"
                      onClick={() => mark.mutate({ item: i, dismiss: false })}>
                      Mark read
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 rounded-full px-3 text-xs"
                    onClick={() => mark.mutate({ item: i, dismiss: true })}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
