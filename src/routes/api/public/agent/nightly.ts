import { createFileRoute } from "@tanstack/react-router";
import {
  assess, istDateKey, isQuietHour,
  type AgentInput, type AgentThresholds,
} from "@/lib/agent-scoring";

/**
 * The Wellness Agent engine.
 *
 * Called by pg_cron (21:30 IST -> task "score", 21:45 IST -> task "nudge") and
 * by the admin panel through a server function. Authenticated with a shared
 * token held in public.agent_secrets (backend-only table).
 *
 * task: "probe" | "score" | "nudge" | "dry-run"
 */

type Task = "probe" | "score" | "nudge" | "dry-run";

const WINDOW = 7;
const dayKeys = (end: Date, n: number) =>
  Array.from({ length: n }, (_, i) => istDateKey(new Date(end.getTime() - i * 86400_000)));

export const Route = createFileRoute("/api/public/agent/nightly")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const token = request.headers.get("x-agent-token") ?? "";
        const { data: secret } = await supabaseAdmin
          .from("agent_secrets").select("cron_token").maybeSingle();
        if (!secret?.cron_token || token !== secret.cron_token) {
          return new Response("Unauthorized", { status: 401 });
        }

        let task: Task = "score";
        try {
          const body = (await request.json()) as { task?: Task };
          if (body?.task) task = body.task;
        } catch { /* default */ }

        const { data: settings } = await supabaseAdmin
          .from("agent_settings").select("*").maybeSingle();
        const thresholds: AgentThresholds = {
          amber_threshold: Number(settings?.amber_threshold ?? 60),
          watch_threshold: Number(settings?.watch_threshold ?? 45),
          low_mood_days: Number(settings?.low_mood_days ?? 3),
          silence_days: Number(settings?.silence_days ?? 4),
          low_sleep_nights: Number(settings?.low_sleep_nights ?? 3),
        };

        // ---- 1. The read everything depends on: who are the active students? ----
        const { data: roleRows, error: roleErr } = await supabaseAdmin
          .from("user_roles").select("user_id").eq("role", "student");
        if (roleErr) {
          console.error("[agent] student role read failed:", roleErr.message);
          return json({ ok: false, students: 0, error: roleErr.message }, 500);
        }
        const ids = Array.from(new Set((roleRows ?? []).map((r) => r.user_id)));

        const { data: profiles } = ids.length
          ? await supabaseAdmin
              .from("profiles")
              .select("id, full_name, suspended, agent_enabled, cohort_id")
              .in("id", ids)
          : { data: [] as any[] };

        const active = (profiles ?? []).filter((p) => !p.suspended && p.agent_enabled !== false);
        console.log(`[agent] service-role read: ${ids.length} student role rows, ${active.length} active students`);

        if (task === "probe") {
          return json({ ok: true, task, studentRoleRows: ids.length, activeStudents: active.length });
        }
        if (!active.length) {
          return json({ ok: true, task, students: 0, note: "no active students" });
        }
        if (settings?.enabled === false && task !== "dry-run") {
          return json({ ok: false, task, reason: "agent disabled in settings" });
        }

        const now = new Date();
        const today = istDateKey(now);
        const window = dayKeys(now, WINDOW);
        const priorWindow = dayKeys(new Date(now.getTime() - WINDOW * 86400_000), WINDOW);
        const sinceIso = new Date(now.getTime() - WINDOW * 2 * 86400_000).toISOString();
        const activeIds = active.map((p) => p.id);

        // ---- 2. One bulk read per signal ----
        const [focusRes, sleepRes, journalRes, moodRes, msgRes, bookingRes, scoreRes, nudgeRes] =
          await Promise.all([
            supabaseAdmin.from("focus_sessions").select("user_id, actual_minutes, created_at").in("user_id", activeIds).gte("created_at", sinceIso),
            supabaseAdmin.from("sleep_logs").select("user_id, log_date, hours, quality").in("user_id", activeIds).gte("log_date", priorWindow[priorWindow.length - 1]),
            supabaseAdmin.from("journal_entries").select("user_id, entry_date").in("user_id", activeIds).gte("entry_date", priorWindow[priorWindow.length - 1]),
            supabaseAdmin.from("mood_checkins").select("user_id, mood_score, created_at").in("user_id", activeIds).gte("created_at", sinceIso),
            supabaseAdmin.from("mentor_messages").select("student_id, created_at").in("student_id", activeIds).gte("created_at", sinceIso),
            supabaseAdmin.from("bookings").select("student_id, created_at").in("student_id", activeIds).gte("created_at", sinceIso),
            supabaseAdmin.from("wellness_scores").select("user_id, score_date, composite, rest_score").in("user_id", activeIds).order("score_date", { ascending: false }),
            supabaseAdmin.from("nudges").select("user_id, created_at").in("user_id", activeIds).order("created_at", { ascending: false }),
          ]);

        const group = <T,>(rows: T[] | null, key: (r: T) => string) => {
          const m = new Map<string, T[]>();
          for (const r of rows ?? []) {
            const k = key(r);
            const arr = m.get(k); if (arr) arr.push(r); else m.set(k, [r]);
          }
          return m;
        };
        const focusBy = group(focusRes.data, (r: any) => r.user_id);
        const sleepBy = group(sleepRes.data, (r: any) => r.user_id);
        const journalBy = group(journalRes.data, (r: any) => r.user_id);
        const moodBy = group(moodRes.data, (r: any) => r.user_id);
        const msgBy = group(msgRes.data, (r: any) => r.student_id);
        const bookBy = group(bookingRes.data, (r: any) => r.student_id);
        const scoreBy = group(scoreRes.data, (r: any) => r.user_id);
        const nudgeBy = group(nudgeRes.data, (r: any) => r.user_id);

        const inWindow = (keys: string[], k: string) => keys.includes(k);

        const build = (uid: string): AgentInput => {
          const focusMinutes: Record<string, number> = {};
          let priorFocusTotal = 0;
          for (const f of focusBy.get(uid) ?? []) {
            const k = istDateKey(new Date((f as any).created_at));
            const mins = Number((f as any).actual_minutes ?? 0);
            if (inWindow(window, k)) focusMinutes[k] = (focusMinutes[k] ?? 0) + mins;
            else if (inWindow(priorWindow, k)) priorFocusTotal += mins;
          }
          const sleep: Record<string, { hours: number; quality: number }> = {};
          const priorSleep: { hours: number; quality: number }[] = [];
          for (const s of sleepBy.get(uid) ?? []) {
            const k = (s as any).log_date as string;
            const row = { hours: Number((s as any).hours ?? 0), quality: Number((s as any).quality ?? 3) };
            if (inWindow(window, k)) sleep[k] = row;
            else if (inWindow(priorWindow, k)) priorSleep.push(row);
          }
          const journalDays = (journalBy.get(uid) ?? [])
            .map((j: any) => j.entry_date as string).filter((k) => inWindow(window, k));
          const mood: Record<string, number> = {};
          for (const m of moodBy.get(uid) ?? []) {
            const k = istDateKey(new Date((m as any).created_at));
            if (inWindow(window, k)) mood[k] = Number((m as any).mood_score ?? 3);
          }
          const connectionEvents =
            (msgBy.get(uid) ?? []).length + (bookBy.get(uid) ?? []).length;

          const activityKeys = [
            ...Object.keys(focusMinutes), ...Object.keys(sleep), ...journalDays, ...Object.keys(mood),
          ].sort();
          const lastActive = activityKeys[activityKeys.length - 1];
          const silenceDays = lastActive
            ? Math.round((Date.parse(today) - Date.parse(lastActive)) / 86400_000)
            : WINDOW;

          const history = scoreBy.get(uid) ?? [];
          const previous = history.find((s: any) => s.score_date !== today) as any;
          const priorRest = priorSleep.length
            ? priorSleep.reduce((a, b) => a + b.hours, 0) / priorSleep.length * 12
            : (previous ? Number(previous.rest_score) : null);

          return {
            focusMinutes, sleep, journalDays, mood, connectionEvents, silenceDays,
            previousComposite: previous ? Number(previous.composite) : null,
            priorFocusPerDay: priorFocusTotal ? priorFocusTotal / WINDOW : null,
            priorRest,
          };
        };

        // ---- 3. Scoring ----
        if (task === "score" || task === "dry-run") {
          const rows: any[] = [];
          const events: any[] = [];
          for (const p of active) {
            const input = build(p.id);
            const r = assess(input, thresholds);
            rows.push({
              user_id: p.id, score_date: today,
              focus_score: r.focus_score, rest_score: r.rest_score,
              reflection_score: r.reflection_score, connection_score: r.connection_score,
              composite: r.composite, risk_band: r.risk_band, reasons: r.reasons,
            });
            events.push({
              user_id: p.id, event_type: "score_written",
              detail: { composite: r.composite, risk_band: r.risk_band, reasons: r.reasons },
            });
          }

          if (task === "dry-run") {
            const bands = rows.reduce((acc: Record<string, number>, r) => {
              acc[r.risk_band] = (acc[r.risk_band] ?? 0) + 1; return acc;
            }, {});
            return json({ ok: true, task, students: rows.length, bands, sample: rows.slice(0, 10) });
          }

          const { error: upErr } = await supabaseAdmin
            .from("wellness_scores").upsert(rows, { onConflict: "user_id,score_date" });
          if (upErr) {
            console.error("[agent] score upsert failed:", upErr.message);
            return json({ ok: false, task, students: rows.length, error: upErr.message }, 500);
          }
          await supabaseAdmin.from("agent_events").insert(events);
          const bands = rows.reduce((acc: Record<string, number>, r) => {
            acc[r.risk_band] = (acc[r.risk_band] ?? 0) + 1; return acc;
          }, {});
          console.log(`[agent] wrote ${rows.length} scores`, bands);
          return json({ ok: true, task, students: rows.length, bands });
        }

        // ---- 4. One nudge per student per day ----
        if (isQuietHour(now, String(settings?.quiet_start ?? "22:00"), String(settings?.quiet_end ?? "07:00"))) {
          return json({ ok: false, task, reason: "quiet hours" });
        }

        let sent = 0, skipped = 0;
        for (const p of active) {
          const lastNudge = (nudgeBy.get(p.id) ?? [])[0] as any;
          if (lastNudge && Date.now() - Date.parse(lastNudge.created_at) < 24 * 3600_000) { skipped++; continue; }

          const input = build(p.id);
          const r = assess(input, thresholds);


          const daysSinceNudge = lastNudge
            ? (Date.now() - Date.parse(lastNudge.created_at)) / 86400_000 : 99;
          if (r.risk_band === "green" && daysSinceNudge < 3) { skipped++; continue; }

          const body = await composeNudge(p.full_name ?? "there", input, r);
          if (!body) { skipped++; continue; }

          const { data: evt } = await supabaseAdmin.from("agent_events").insert({
            user_id: p.id, event_type: "nudge_composed",
            detail: { risk_band: r.risk_band, composite: r.composite, reasons: r.reasons },
          }).select("id").maybeSingle();

          const { error } = await supabaseAdmin.from("nudges").insert({
            user_id: p.id, body,
            tone: r.risk_band === "green" ? "warm" : "gentle",
            source_event_id: evt?.id ?? null,
          });
          if (error) { console.error("[agent] nudge insert failed:", error.message); skipped++; }
          else sent++;
        }
        console.log(`[agent] nudges sent ${sent}, skipped ${skipped}`);
        return json({ ok: true, task, sent, skipped });
      },
    },
  },
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status, headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** ONE warm two-sentence message. Never guilt, never "should". */
async function composeNudge(
  name: string,
  input: AgentInput,
  r: { composite: number; risk_band: string; reasons: string[] },
): Promise<string | null> {
  const focusPerDay = Math.round(Object.values(input.focusMinutes).reduce((a, b) => a + b, 0) / 7);
  const nights = Object.values(input.sleep);
  const avgSleep = nights.length ? (nights.reduce((a, b) => a + b.hours, 0) / nights.length).toFixed(1) : "unlogged";
  const moods = Object.values(input.mood);
  const avgMood = moods.length ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : "unlogged";

  const week = [
    `first name: ${name.split(" ")[0]}`,
    `average tracked study: ${focusPerDay} minutes/day`,
    `average sleep: ${avgSleep} hours`,
    `average mood (1-5): ${avgMood}`,
    `journal entries this week: ${input.journalDays.length}`,
    `human contact events: ${input.connectionEvents}`,
    `days of silence: ${input.silenceDays}`,
    `wellness composite: ${r.composite} (${r.risk_band})`,
    `patterns: ${r.reasons.join("; ") || "none"}`,
  ].join("\n");

  const fallback = focusPerDay > 480
    ? "You've put in a lot of hours this week — that takes real commitment. Tonight, let rest be the next thing you do well."
    : input.silenceDays >= 4
      ? "It's been a quiet few days here, and that's completely okay. Whenever you're ready, one small check-in is enough."
      : "You showed up this week, in your own way. Keep it gentle tomorrow — one arc at a time.";

  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return fallback;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You write one message to a teenage exam student from a calm wellness companion. " +
              "Exactly two sentences, under 40 words, second person, warm and specific to their week. " +
              "Never use guilt, never use the words 'should' or 'must', never give medical advice, never mention scores or numbers. " +
              "If they are overworking or under-slept, tell them plainly to rest. Output only the message.",
          },
          { role: "user", content: week },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[agent] AI gateway", res.status, await res.text());
      return fallback;
    }
    const data = (await res.json()) as any;
    const text = data?.choices?.[0]?.message?.content?.trim();
    return typeof text === "string" && text.length > 10 ? text : fallback;
  } catch (e) {
    console.error("[agent] AI gateway failed", e);
    return fallback;
  }
}
