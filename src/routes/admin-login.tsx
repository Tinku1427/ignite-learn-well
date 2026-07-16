import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-login")({ component: AdminLogin });

async function checkStaff(userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  return roles.includes("admin") || roles.includes("counsellor");
}

function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user && (await checkStaff(data.session.user.id))) router.navigate({ to: "/admin" });
    });
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setBusy(false); return toast.error(error.message); }
    const ok = data.user ? await checkStaff(data.user.id) : false;
    setBusy(false);
    if (!ok) {
      await supabase.auth.signOut();
      return toast.error("This account isn't set up for admin access.");
    }
    router.navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="font-display text-xl">Guiding Mentor</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">Admin & Counsellors</div>
        </div>
        <form onSubmit={submit} className="soft-card space-y-4 p-7">
          <div>
            <Label htmlFor="e">Email</Label>
            <Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p">Password</Label>
            <Input id="p" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy} className="w-full rounded-full">{busy ? "…" : "Sign in"}</Button>
        </form>
      </div>
    </div>
  );
}
