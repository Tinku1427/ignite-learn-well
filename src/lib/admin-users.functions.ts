import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ROLES = ["student", "mentor", "coach", "counsellor", "admin"] as const;

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Admins only");
}

/** Create an already-active user (no email confirmation) and give them one role. */
export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(72),
        fullName: z.string().trim().max(120).default(""),
        role: z.enum(ROLES),
        cohortId: z.string().uuid().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error || !created.user) throw new Error(error?.message ?? "Could not create user");
    const uid = created.user.id;

    await supabaseAdmin
      .from("profiles")
      .upsert(
        { id: uid, full_name: data.fullName || data.email, cohort_id: data.cohortId ?? null },
        { onConflict: "id" },
      );
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: uid, role: data.role }, { onConflict: "user_id,role" });

    if (data.role === "mentor") {
      await supabaseAdmin
        .from("mentors")
        .upsert({ profile_id: uid, active: true, verification_status: "pending" }, { onConflict: "profile_id" });
    } else if (data.role === "coach" || data.role === "counsellor") {
      await supabaseAdmin
        .from("coaches")
        .upsert({ profile_id: uid, active: true, verification_status: "pending" }, { onConflict: "profile_id" });
    }

    return { id: uid, email: data.email };
  });

/** Reversible: block sign-in, keep every row of their data. */
export const adminSetSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), suspended: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot suspend your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      // 100 years vs none — Supabase's own "ban" mechanism.
      ban_duration: data.suspended ? "876000h" : "none",
    });
    await supabaseAdmin
      .from("profiles")
      .update({
        suspended: data.suspended,
        suspended_at: data.suspended ? new Date().toISOString() : null,
        suspended_by: data.suspended ? context.userId : null,
      } as never)
      .eq("id", data.userId);

    return { ok: true, suspended: data.suspended };
  });

/** Destructive and final. Requires the caller to have typed DELETE. */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ userId: z.string().uuid(), confirm: z.literal("DELETE") }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Auth deletion cascades every table that references auth.users.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin-only directory: profiles + roles + suspension state. */
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profiles }, { data: roles }, list] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, cohort_id, suspended, suspended_at, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
    ]);

    const emails = new Map((list.data?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as string);
      roleMap.set(r.user_id, arr);
    }

    return (profiles ?? []).map((p) => {
      const row = p as typeof p & { suspended?: boolean | null; suspended_at?: string | null };
      return {
        id: row.id,
        full_name: row.full_name ?? "",
        email: emails.get(row.id) ?? "",
        cohort_id: row.cohort_id ?? null,
        suspended: !!row.suspended,
        suspended_at: row.suspended_at ?? null,
        roles: roleMap.get(row.id) ?? [],
      };
    });
  });
