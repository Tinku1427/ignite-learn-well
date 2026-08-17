import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MoodFace, MOOD_LABEL, type MoodValue } from "./mood-face";
import { ArrowRight } from "lucide-react";

/**
 * BeforeAfter — the emotional centrepiece of the transformation arc.
 * Baseline face (earliest mood check-in) → current face (latest).
 * Purely visual. Never a grade. Never a number surfaced to a parent.
 */
export function BeforeAfter() {
  const { user } = useAuth();

  const { data } = useQuery({
    enabled: !!user,
    queryKey: ["before-after", user?.id],
    queryFn: async () => {
      const [first, last] = await Promise.all([
        supabase
          .from("mood_checkins")
          .select("mood_score, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("mood_checkins")
          .select("mood_score, created_at")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      return {
        baseline: first.data,
        current: last.data,
      };
    },
  });

  if (!data?.baseline) {
    return (
      <div className="soft-card p-6">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Your arc</div>
        <div className="mt-1 font-display text-xl">The story starts today</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your first mood check-in becomes the "before" face — the one we'll look back on.
        </p>
      </div>
    );
  }

  const before = clamp(data.baseline.mood_score);
  const after = clamp(data.current?.mood_score ?? data.baseline.mood_score);
  const shift = after - before;
  const line =
    !data.current || data.current.created_at === data.baseline.created_at
      ? "One face on the page. Come back tomorrow and we'll add another."
      : shift > 0
        ? "You started here — look where you are now."
        : shift < 0
          ? "Some weeks tilt down. That's real, and it's still worth looking at honestly."
          : "Holding steady. Steady is underrated.";

  const startedOn = new Date(data.baseline.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const nowOn = data.current
    ? new Date(data.current.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : "today";

  return (
    <div className="soft-card p-6 md:p-8">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">Before → after</div>
      <div className="mt-1 font-display text-xl">Your face on the page</div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 md:gap-6">
        <div className="flex flex-col items-center gap-2">
          <img src="/arc-before.svg" className="h-24 w-24 object-contain" alt="" />
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Started {startedOn}</div>
          <div className="text-sm">{MOOD_LABEL[before]}</div>
        </div>

        <ArrowRight className="size-6 text-muted-foreground shrink-0" aria-hidden />

        <div className="flex flex-col items-center gap-2">
          <img src="/arc-after.svg" className="h-24 w-24 object-contain" alt="" />
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{nowOn}</div>
          <div className="text-sm">{MOOD_LABEL[after]}</div>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground max-w-md mx-auto">{line}</p>
    </div>
  );
}

function clamp(n: number | null | undefined): MoodValue {
  const v = Math.max(1, Math.min(5, Math.round(n ?? 3)));
  return v as MoodValue;
}
