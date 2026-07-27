import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "admin" | "mentor" | "counsellor" | "coach";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadRoles = async (uid: string) => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      if (!mounted) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const uid = session.user.id;
        setTimeout(() => {
          loadRoles(uid).finally(() => mounted && setLoading(false));
        }, 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const u = data.session?.user ?? null;
      setUser(u);
      // Roles must resolve BEFORE loading flips false — gates read both together
      // and would otherwise sign the user out against an empty roles array.
      if (u) await loadRoles(u.id);
      else setRoles([]);
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return {
    user, roles, loading,
    isAdmin: roles.includes("admin"),
    isCounsellor: roles.includes("counsellor"),
    isCoach: roles.includes("coach") || roles.includes("counsellor"),
    isMentor: roles.includes("mentor"),
    isStaff: roles.includes("admin"),
  };
}
