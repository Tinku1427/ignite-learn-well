import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Admin-only: backfill wellness scores for the last N days.
// Calls the internal cron route so scoring logic stays in one place.
export const backfillWellnessScores = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = (input ?? {}) as { days?: number };
    const days = Math.max(1, Math.min(60, Number(i.days ?? 14)));
    return { days };
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin, error } = await context.supabase
      .rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (error) throw new Error(error.message);
    if (!isAdmin) throw new Error("Forbidden");

    const base = process.env.SITE_URL ?? "http://localhost:8080";
    const res = await fetch(`${base}/api/public/hooks/wellness-daily`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "",
      },
      body: JSON.stringify({ days: data.days }),
    });
    if (!res.ok) throw new Error(`Scoring endpoint failed: ${res.status}`);
    return (await res.json()) as { ok: boolean; days: number; students: number; upserts: number };
  });
