import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { scoreDay, type DayInputs } from "@/lib/wellness-scoring.server";

// Compute wellness scores for a range of days.
// Body: { days?: number } — how many trailing days to (re)compute. Default 1 (yesterday).
export const Route = createFileRoute("/api/public/hooks/wellness-daily")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = request.headers.get("apikey");
        if (key !== process.env.SUPABASE_PUBLISHABLE_KEY && key !== process.env.SUPABASE_ANON_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }

        const url = process.env.SUPABASE_URL!;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const admin = createClient(url, serviceKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        let days = 1;
        try {
          const body = (await request.json().catch(() => ({}))) as { days?: number };
          if (body?.days && body.days > 0 && body.days <= 60) days = body.days;
        } catch { /* empty body ok */ }

        const dates: string[] = [];
        for (let i = 1; i <= days; i++) {
          const d = new Date();
          d.setUTCDate(d.getUTCDate() - i);
          dates.push(d.toISOString().slice(0, 10));
        }

        const { data: students, error: sErr } = await admin.from("profiles").select("id");
        if (sErr) return new Response(sErr.message, { status: 500 });

        const results = await computeAndUpsert(admin, students ?? [], dates);
        return Response.json({ ok: true, days, students: students?.length ?? 0, upserts: results });
      },
    },
  },
});

async function computeAndUpsert(
  admin: ReturnType<typeof createClient>,
  students: { id: string }[],
  dates: string[],
) {
  let upserts = 0;
  for (const s of students) {
    const rows: Array<{
      user_id: string; score_date: string;
      focus_score: number; rest_score: number; reflection_score: number;
      connection_score: number; composite: number; risk_band: string; reasons: string[];
    }> = [];

    for (const date of dates) {
      const startIso = `${date}T00:00:00.000Z`;
      const endIso = `${date}T23:59:59.999Z`;

      const [pomos, sleep, journal, mood, msgs, bookings] = await Promise.all([
        admin.from("pomodoro_sessions").select("duration_min")
          .eq("user_id", s.id).gte("completed_at", startIso).lte("completed_at", endIso),
        admin.from("sleep_logs").select("hours,quality")
          .eq("user_id", s.id).eq("log_date", date).maybeSingle(),
        admin.from("journal_entries").select("id")
          .eq("user_id", s.id).eq("entry_date", date).maybeSingle(),
        admin.from("mood_logs").select("score")
          .eq("user_id", s.id).eq("log_date", date).maybeSingle(),
        admin.from("mentor_messages").select("id")
          .eq("student_id", s.id).gte("created_at", startIso).lte("created_at", endIso),
        admin.from("bookings").select("id")
          .eq("student_id", s.id).gte("scheduled_at", startIso).lte("scheduled_at", endIso),
      ]);

      const pomodoroMinutes = ((pomos.data ?? []) as { duration_min: number | null }[])
        .reduce((sum, r) => sum + (r.duration_min ?? 0), 0);
      const sleepRow = sleep.data as { hours: number; quality: number } | null;
      const moodRow = mood.data as { score: number } | null;
      const mentorTouches = (msgs.data?.length ?? 0) + (bookings.data?.length ?? 0);

      const inputs: DayInputs = {
        pomodoroMinutes,
        sleepHours: sleepRow?.hours ?? null,
        sleepQuality: sleepRow?.quality ?? null,
        journaled: !!journal.data,
        moodLogged: !!moodRow,
        moodScore: moodRow?.score ?? null,
        mentorTouches,
      };
      const sc = scoreDay(inputs);
      rows.push({
        user_id: s.id, score_date: date,
        focus_score: sc.focus, rest_score: sc.rest,
        reflection_score: sc.reflection, connection_score: sc.connection,
        composite: sc.composite, risk_band: sc.risk_band, reasons: sc.reasons,
      });
    }

    if (rows.length) {
      const { error } = await admin.from("wellness_scores")
        .upsert(rows, { onConflict: "user_id,score_date" });
      if (!error) upserts += rows.length;
    }
  }
  return upserts;
}
