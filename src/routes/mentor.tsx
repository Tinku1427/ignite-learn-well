import { MessagesCard } from "@/components/messages-card";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleGate } from "@/components/role-gate";
import { StaffShell } from "@/components/staff-shell";
import { Scene } from "@/components/scene";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/mentor")({
  component: () => (
    <RoleGate role="mentor">
      <StaffShell title="Guiding Mentor" subtitle="Mentor" nav={[
        { to: "/mentor", label: "My students" },
      ]}>
        <MentorHome />
      </StaffShell>
    </RoleGate>
  ),
});

function MentorHome() {
  const { user } = useAuth();

  const { data: mentorRow } = useQuery({
    enabled: !!user,
    queryKey: ["mentor-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("mentors").select("id, verification_status").eq("profile_id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: bookings = [] } = useQuery({
    enabled: !!mentorRow?.id,
    queryKey: ["mentor-bookings", mentorRow?.id],
    queryFn: async () => {
      const { data } = await supabase.from("bookings").select("id, student_id, status, created_at").eq("mentor_id", mentorRow!.id);
      return data ?? [];
    },
  });

  const studentIds = Array.from(new Set(bookings.map((b) => b.student_id)));

  const { data: students = [] } = useQuery({
    enabled: studentIds.length > 0,
    queryKey: ["mentor-students", studentIds],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name").in("id", studentIds);
      return data ?? [];
    },
  });

  const { data: focus = [] } = useQuery({
    enabled: studentIds.length > 0,
    queryKey: ["mentor-focus", studentIds],
    queryFn: async () => {
      const { data } = await supabase.from("focus_sessions").select("user_id, actual_minutes, completed, created_at").in("user_id", studentIds).gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());
      return data ?? [];
    },
  });

  if (mentorRow && mentorRow.verification_status !== "verified") {
    return (
      <div className="soft-card p-8 max-w-md">
        <Scene kind="ambient" size={120} />
        <h2 className="mt-4 font-display text-xl">Verification pending</h2>
        <p className="mt-2 text-sm text-muted-foreground">An admin needs to verify your college before students can book you.</p>
      </div>
    );
  }

  const minutesByStudent = new Map<string, number>();
  for (const f of focus) minutesByStudent.set(f.user_id, (minutesByStudent.get(f.user_id) ?? 0) + (f.actual_minutes ?? 0));

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Mentor</div>
          <h1 className="mt-1 font-display text-3xl">Your students</h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-md">Study time and wellness trend — the diary and mood entries stay with the student.</p>
        </div>
        <Scene kind="focus" size={96} />
      </header>

      <MessagesCard title="From the admin" />

      <ul className="space-y-2">
        {students.map((s) => {
          const mins = minutesByStudent.get(s.id) ?? 0;
          return (
            <li key={s.id} className="soft-card p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.full_name ?? "Student"}</div>
                <div className="text-xs text-muted-foreground">{mins} focus minutes this week</div>
              </div>
              <div className="text-xs text-muted-foreground">Trend: {mins > 300 ? "↑ up" : mins > 90 ? "→ steady" : "↓ low"}</div>
            </li>
          );
        })}
        {students.length === 0 && <div className="soft-card p-6 text-sm text-muted-foreground">No bookings yet.</div>}
      </ul>
    </div>
  );
}
