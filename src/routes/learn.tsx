import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Protected } from "@/components/protected";
import { Button } from "@/components/ui/button";
import { Scene } from "@/components/scene";
import { Video, PlayCircle, ExternalLink } from "lucide-react";

type Session = {
  id: string; title: string; description: string | null;
  zoom_url: string | null; recording_url: string | null;
  scheduled_at: string; duration_minutes: number | null;
};

export const Route = createFileRoute("/learn")({
  component: () => <Protected><Learn /></Protected>,
});

function Learn() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["live-sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("live_sessions")
        .select("id,title,description,zoom_url,recording_url,scheduled_at,duration_minutes")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data as Session[];
    },
  });

  const now = Date.now();
  const upcoming = sessions.filter((s) => new Date(s.scheduled_at).getTime() > now);
  const past = sessions.filter((s) => new Date(s.scheduled_at).getTime() <= now);

  return (
    <>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Learn</div>
        <h1 className="font-display text-3xl">Live sessions & recordings</h1>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

      {!isLoading && sessions.length === 0 && (
        <div className="soft-card grid place-items-center p-8 text-center">
          <Scene kind="focus" size={160} />
          <p className="mt-2 text-sm text-muted-foreground">Nothing scheduled yet.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Coming up</h2>
          <ul className="space-y-3">
            {upcoming.map((s) => <SessionCard key={s.id} s={s} />)}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">Recordings</h2>
          <ul className="space-y-3">
            {past.map((s) => <SessionCard key={s.id} s={s} past />)}
          </ul>
        </section>
      )}
    </>
  );
}

function SessionCard({ s, past = false }: { s: Session; past?: boolean }) {
  const when = new Date(s.scheduled_at).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
  return (
    <li className="soft-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium">{s.title}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {when}{s.duration_minutes ? ` · ${s.duration_minutes} min` : ""}
          </div>
          {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
        </div>
        {!past && s.zoom_url && (
          <Button asChild size="sm" className="rounded-full shrink-0">
            <a href={s.zoom_url} target="_blank" rel="noreferrer">
              <Video className="mr-1.5 size-4" /> Join
            </a>
          </Button>
        )}
        {past && s.recording_url && (
          <Button asChild size="sm" variant="outline" className="rounded-full shrink-0">
            <a href={s.recording_url} target="_blank" rel="noreferrer">
              <PlayCircle className="mr-1.5 size-4" /> Watch
            </a>
          </Button>
        )}
        {past && !s.recording_url && (
          <span className="text-[11px] text-muted-foreground">Recording coming</span>
        )}
      </div>
      {past && s.recording_url && (
        <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-muted">
          <iframe src={s.recording_url} title={s.title} className="h-full w-full" allowFullScreen />
        </div>
      )}
    </li>
  );
}
