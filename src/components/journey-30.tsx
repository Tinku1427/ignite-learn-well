import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

/**
 * Journey30 — the student's own 30-day window, anchored to THEIR start date.
 *
 * Day 1 is the day the student's account was created - i.e. the day they first
 * logged in - not a shared cohort date and not the onboarding date. A student
 * handed the app today starts at Day 1 today.
 *
 * A circle fills simply because the student OPENED the app that day (recorded in
 * public.login_days by Protected). Showing up is the habit; no practice required.
 *
 * Never a grade, never a comparison to another student, no streak-shaming:
 * a missed day is quietly empty, not marked wrong.
 */

const WINDOW_DAYS = 30;

/** Local-midnight day key, so a 11pm journal counts as that day, not the next. */
function dayKey(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function Journey30() {
  const { user } = useAuth();

  const { data, isPending } = useQuery({
    enabled: !!user,
    queryKey: ["journey-30", user?.id],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", user!.id)
        .maybeSingle();

      const startRaw = profile?.created_at;
      if (!startRaw) return null;

      // Normalise to local midnight of day 1.
      const start = new Date(startRaw);
      start.setHours(0, 0, 0, 0);
      // Days the student opened the app. One cheap query, no journal content.
      const { data: logins } = await supabase
        .from("login_days")
        .select("day")
        .eq("user_id", user!.id)
        .gte("day", dayKey(start));

      const active = new Set<string>((logins ?? []).map((r) => r.day as string));

      return { start, active };
    },
  });

  if (isPending || !data) return <JourneySkeleton />;

  const { start, active } = data;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const elapsed = Math.floor((today.getTime() - start.getTime()) / 86_400_000);
  const dayNumber = Math.min(WINDOW_DAYS, Math.max(1, elapsed + 1));
  const complete = elapsed + 1 > WINDOW_DAYS;

  const days = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const date = addDays(start, i);
    return {
      index: i + 1,
      date,
      practised: active.has(dayKey(date)),
      isToday: i === elapsed,
      future: i > elapsed,
    };
  });

  const practisedCount = days.filter((d) => d.practised).length;
  const soFar = Math.min(elapsed + 1, WINDOW_DAYS);

  return (
    <div className="soft-card p-6 md:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Your first month</div>
          <div className="mt-1 font-display text-xl">
            {complete ? "Thirty days in" : `Day ${dayNumber} of ${WINDOW_DAYS}`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-display text-2xl tabular-nums">{practisedCount}</div>
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">days here</div>
        </div>
      </div>

      <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
          style={{ width: `${Math.min(100, (soFar / WINDOW_DAYS) * 100)}%` }}
        />
      </div>

      <div className="mt-6 grid grid-cols-10 gap-2" role="list" aria-label="Your first 30 days">
        {days.map((d) => (
          <div
            key={d.index}
            role="listitem"
                title={`Day ${d.index} · ${d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}${d.practised ? " · you were here" : ""}`}
            className={cn(
              "aspect-square rounded-full transition-colors",
              d.practised && "bg-primary",
              !d.practised && !d.future && "bg-border",
              d.future && "bg-border/40",
              d.isToday && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {practisedCount === 0
          ? "Nothing here yet. Just opening the app tomorrow fills a circle."
          : complete
            ? `You showed up on ${practisedCount} of your first ${WINDOW_DAYS} days. That is the whole story.`
            : `You showed up on ${practisedCount} of ${soFar} days so far. Missed days stay blank — they are not marks against you.`}
      </p>
    </div>
  );
}

function JourneySkeleton() {
  return (
    <div className="soft-card p-6 md:p-8">
      <div className="h-3 w-28 rounded bg-border/60" />
      <div className="mt-2 h-6 w-40 rounded bg-border/60" />
      <div className="mt-5 h-1.5 w-full rounded-full bg-border/40" />
      <div className="mt-6 grid grid-cols-10 gap-2">
        {Array.from({ length: WINDOW_DAYS }, (_, i) => (
          <div key={i} className="aspect-square rounded-full bg-border/40" />
        ))}
      </div>
    </div>
  );
}
