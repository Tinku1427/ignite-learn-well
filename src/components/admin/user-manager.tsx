import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  adminCreateUser,
  adminDeleteUser,
  adminListUsers,
  adminSetSuspended,
} from "@/lib/admin-users.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Ban, RotateCcw, ShieldAlert, UserPlus } from "lucide-react";

type Row = Awaited<ReturnType<typeof adminListUsers>>[number];

const ROLES = ["student", "mentor", "coach", "counsellor", "admin"] as const;

export function UserManager() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const create = useServerFn(adminCreateUser);
  const setSuspended = useServerFn(adminSetSuspended);
  const hardDelete = useServerFn(adminDeleteUser);

  const [q, setQ] = useState("");
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [confirmText, setConfirmText] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => list(),
  });

  const { data: cohorts = [] } = useQuery({
    queryKey: ["cohorts"],
    queryFn: async () => {
      const { data } = await supabase.from("cohorts").select("id, name").order("name");
      return data ?? [];
    },
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ["coach-options"],
    queryFn: async () => {
      const { data } = await supabase.from("coaches").select("profile_id").eq("active", true);
      const ids = (data ?? []).map((c) => c.profile_id);
      if (!ids.length) return [] as { id: string; name: string }[];
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      return (profs ?? []).map((p) => ({ id: p.id, name: p.full_name ?? "Coach" }));
    },
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["coach-assignments"],
    queryFn: async () => {
      const { data } = await supabase.from("coach_assignments").select("coach_id, student_id");
      return data ?? [];
    },
  });
  const coachOf = useMemo(
    () => new Map(assignments.map((a) => [a.student_id, a.coach_id])),
    [assignments],
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-users"] });
    qc.invalidateQueries({ queryKey: ["coach-assignments"] });
  };

  // ---- create ----
  const [form, setForm] = useState({ email: "", password: "", fullName: "", role: "student" as (typeof ROLES)[number], cohortId: "" });
  const createMut = useMutation({
    mutationFn: () =>
      create({
        data: {
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          role: form.role,
          cohortId: form.cohortId || null,
        },
      }),
    onSuccess: () => {
      toast.success(`${form.email} is active now`);
      setForm({ email: "", password: "", fullName: "", role: "student", cohortId: "" });
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create user"),
  });

  const suspendMut = useMutation({
    mutationFn: (v: { userId: string; suspended: boolean }) => setSuspended({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.suspended ? "Account suspended — data kept" : "Account reactivated");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (userId: string) => hardDelete({ data: { userId, confirm: "DELETE" as const } }),
    onSuccess: () => {
      toast.success("Account and data permanently deleted");
      setDeleting(null);
      setConfirmText("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const setCohort = useMutation({
    mutationFn: async (v: { userId: string; cohortId: string | null }) => {
      const { error } = await supabase.from("profiles").update({ cohort_id: v.cohortId }).eq("id", v.userId);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cohort updated"); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const setCoach = useMutation({
    mutationFn: async (v: { studentId: string; coachId: string | null }) => {
      await supabase.from("coach_assignments").delete().eq("student_id", v.studentId);
      if (v.coachId) {
        const { error } = await supabase
          .from("coach_assignments")
          .insert({ student_id: v.studentId, coach_id: v.coachId });
        if (error) throw error;
      }
    },
    onSuccess: () => { toast.success("Coach updated"); refresh(); },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const filtered = users.filter((u) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return u.email.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      {/* Add user */}
      <div className="soft-card p-5">
        <div className="flex items-center gap-2 text-sm font-medium"><UserPlus className="size-4" /> Add a user</div>
        <p className="mt-1 text-xs text-muted-foreground">Created instantly active — no confirmation email.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Riya Sharma" />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Temporary password</Label>
            <Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="min 8 characters" />
          </div>
          <div>
            <Label>Role</Label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as (typeof ROLES)[number] })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm capitalize">
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <Label>Cohort (optional)</Label>
            <select value={form.cohortId} onChange={(e) => setForm({ ...form, cohortId: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm">
              <option value="">No cohort</option>
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <Button
          className="mt-4 rounded-full"
          disabled={createMut.isPending || !form.email || form.password.length < 8}
          onClick={() => createMut.mutate()}
        >
          {createMut.isPending ? "…" : "Create user"}
        </Button>
      </div>

      {/* Directory */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-muted-foreground">Everyone ({filtered.length})</h3>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className="max-w-56" />
        </div>

        {isLoading && <div className="soft-card p-6 text-sm text-muted-foreground">Loading…</div>}

        <ul className="space-y-2">
          {filtered.map((u) => {
            const isStudent = u.roles.includes("student");
            return (
              <li key={u.id} className={cn("soft-card p-4", u.suspended && "opacity-70 ring-1 ring-border")}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{u.full_name || "—"}</span>
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-widest">{r}</span>
                      ))}
                      {u.suspended && (
                        <span className="rounded-full bg-apricot/40 px-2 py-0.5 text-[10px] uppercase tracking-widest">suspended</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline" size="sm" className="rounded-full"
                      disabled={suspendMut.isPending}
                      onClick={() => suspendMut.mutate({ userId: u.id, suspended: !u.suspended })}
                    >
                      {u.suspended ? <><RotateCcw className="mr-1.5 size-3.5" /> Reactivate</> : <><Ban className="mr-1.5 size-3.5" /> Suspend</>}
                    </Button>
                    <button
                      onClick={() => { setDeleting(u); setConfirmText(""); }}
                      className="rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      Delete…
                    </button>
                  </div>
                </div>

                {isStudent && (
                  <div className="mt-3 grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Cohort</Label>
                      <select
                        value={u.cohort_id ?? ""}
                        onChange={(e) => setCohort.mutate({ userId: u.id, cohortId: e.target.value || null })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="">No cohort</option>
                        {cohorts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs">Assigned coach</Label>
                      <select
                        value={coachOf.get(u.id) ?? ""}
                        onChange={(e) => setCoach.mutate({ studentId: u.id, coachId: e.target.value || null })}
                        className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                      >
                        <option value="">No coach</option>
                        {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Typed-confirmation delete */}
      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="soft-card w-full max-w-md p-6">
            <div className="flex items-center gap-2 text-sm font-medium"><ShieldAlert className="size-4" /> Permanent delete</div>
            <h3 className="mt-2 font-display text-xl">Delete {deleting.full_name || deleting.email}?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes the account and every row of their data — journal, mood, scores. It cannot be
              undone. If you only want to stop them logging in, use Suspend instead.
            </p>
            <Label className="mt-4 block text-xs">Type DELETE to confirm</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" className="rounded-full" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                className="rounded-full"
                disabled={confirmText !== "DELETE" || deleteMut.isPending}
                onClick={() => deleteMut.mutate(deleting.id)}
              >
                {deleteMut.isPending ? "…" : "Delete permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
