import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Admins only");
}

/** Run the nightly engine on demand: probe (row count), score, nudge, or dry-run. */
export const runAgentTask = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ task: z.enum(["probe", "score", "nudge", "dry-run"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: secret } = await supabaseAdmin.from("agent_secrets").select("cron_token").maybeSingle();
    if (!secret?.cron_token) throw new Error("Agent token missing");

    const origin = new URL(getRequest().url).origin;
    const res = await fetch(`${origin}/api/public/agent/nightly`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-agent-token": secret.cron_token },
      body: JSON.stringify({ task: data.task }),
    });
    const text = await res.text();
    return { status: res.status, result: text };
  });

/** A hand-written nudge from a human. Lands in the student's Home exactly like the agent's. */
export const sendManualNudge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), body: z.string().trim().min(4).max(400) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: evt } = await supabaseAdmin.from("agent_events").insert({
      user_id: data.userId, event_type: "manual_nudge", detail: { by: context.userId },
    }).select("id").maybeSingle();
    const { error } = await supabaseAdmin.from("nudges").insert({
      user_id: data.userId, body: data.body, tone: "warm", source_event_id: evt?.id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Nudge delivery log with names, for the admin panel. */
export const listNudgeLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: nudges } = await supabaseAdmin
      .from("nudges").select("id, user_id, body, tone, created_at, seen_at, dismissed_at")
      .order("created_at", { ascending: false }).limit(100);
    const ids = Array.from(new Set((nudges ?? []).map((n) => n.user_id)));
    const { data: profs } = ids.length
      ? await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as { id: string; full_name: string | null }[] };
    const names = new Map((profs ?? []).map((p) => [p.id, p.full_name ?? ""]));
    return (nudges ?? []).map((n) => ({ ...n, name: names.get(n.user_id) || "Student" }));
  });
