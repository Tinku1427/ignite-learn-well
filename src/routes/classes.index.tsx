import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Protected } from "@/components/protected";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/classes")({
  head: () => ({ meta: [{ title: "Recorded Classes — Guiding Mentor" }] }),
  component: () => <Protected><Classes /></Protected>,
});

function Classes() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data } = useQuery({
    queryKey: ["classes-all", uid],
    queryFn: async () => {
      const [subs, cls, prog] = await Promise.all([
        supabase.from("subjects").select("*").order("name"),
        supabase.from("classes").select("*").eq("published", true).order("created_at", { ascending: false }),
        supabase.from("class_progress").select("class_id, completed_at").eq("user_id", uid!),
      ]);
      const completed = new Set((prog.data ?? []).filter((p) => p.completed_at).map((p) => p.class_id));
      return { subjects: subs.data ?? [], classes: cls.data ?? [], completed };
    },
    enabled: !!uid,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Recorded classes</h1>
        <p className="text-muted-foreground text-sm">Learn at your pace. Mark complete as you go.</p>
      </div>

      {(data?.subjects ?? []).map((s) => {
        const list = (data?.classes ?? []).filter((c) => c.subject_id === s.id);
        if (!list.length) return null;
        return (
          <section key={s.id}>
            <div className="text-sm font-medium mb-2">{s.name} <span className="text-xs text-muted-foreground">({s.exam})</span></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((c) => (
                <Link key={c.id} to="/classes/watch/$classId" params={{ classId: c.id }}>
                  <Card className="hover:shadow-md transition h-full">
                    <CardContent className="p-4">
                      <div className="aspect-video rounded-lg gradient-calm grid place-items-center text-primary-foreground mb-3">
                        <PlayCircle className="size-10 opacity-80" />
                      </div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium line-clamp-2">{c.title}</div>
                        {data?.completed.has(c.id) && <CheckCircle2 className="size-4 text-success shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">{c.duration_min || 0} min</Badge>
                        {data?.completed.has(c.id) ? <Badge className="bg-success text-primary-foreground">Watched</Badge> : <Badge variant="outline">Not started</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      {(data?.classes.length ?? 0) === 0 && (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No classes published yet. Check back soon.</CardContent></Card>
      )}
    </div>
  );
}
