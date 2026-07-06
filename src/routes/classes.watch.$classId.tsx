import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/classes/watch/$classId")({
  component: () => <Protected><Watch /></Protected>,
});

function toEmbed(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video${u.pathname}`;
  } catch {}
  return url;
}

function Watch() {
  const { classId } = useParams({ from: "/classes/watch/$classId" });
  const { user } = useAuth();
  const uid = user?.id;
  const qc = useQueryClient();

  const { data: cls } = useQuery({
    queryKey: ["class", classId],
    queryFn: async () => (await supabase.from("classes").select("*").eq("id", classId).maybeSingle()).data,
  });

  const { data: progress } = useQuery({
    queryKey: ["class-progress", classId, uid],
    queryFn: async () => (await supabase.from("class_progress").select("*").eq("class_id", classId).eq("user_id", uid!).maybeSingle()).data,
    enabled: !!uid,
  });

  const complete = useMutation({
    mutationFn: async () => {
      await supabase.from("class_progress").upsert({ user_id: uid!, class_id: classId, completed_at: new Date().toISOString() }, { onConflict: "user_id,class_id" });
    },
    onSuccess: () => {
      toast.success("Marked complete");
      qc.invalidateQueries({ queryKey: ["class-progress", classId, uid] });
    },
  });

  if (!cls) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold">{cls.title}</h1>
        {cls.description && <p className="text-muted-foreground text-sm">{cls.description}</p>}
      </div>
      <div className="aspect-video rounded-2xl overflow-hidden border bg-black">
        <iframe src={toEmbed(cls.video_url)} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
      </div>
      <div className="flex flex-wrap gap-3">
        {cls.notes_url && (
          <a href={cls.notes_url} target="_blank" rel="noreferrer">
            <Button variant="outline" className="gap-2"><FileText className="size-4" /> Download notes</Button>
          </a>
        )}
        <Button onClick={() => complete.mutate()} disabled={!!progress?.completed_at} className="gap-2">
          <CheckCircle2 className="size-4" /> {progress?.completed_at ? "Completed" : "Mark as complete"}
        </Button>
      </div>
    </div>
  );
}
