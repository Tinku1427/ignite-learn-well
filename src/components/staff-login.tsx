import { useEffect, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fetchRoles, ROLE_HOME, type AppRole } from "@/lib/role-routing";
import { BrandLogo } from "@/components/brand-logo";


/** A single-role sign-in portal. Only accounts holding `role` may enter. */
export function StaffLogin({
  role,
  title,
  kicker,
  blurb,
}: { role: AppRole | AppRole[]; title: string; kicker: string; blurb: string }) {
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];
  const home = ROLE_HOME[allowed[0]];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) return;
      const roles = await fetchRoles(u.id);
      if (roles.some((r) => allowed.includes(r))) router.navigate({ to: home });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error || !data.user) {
      setBusy(false);
      return toast.error(error?.message ?? "Sign-in failed");
    }
    const roles = await fetchRoles(data.user.id);
    setBusy(false);
    if (!roles.some((r) => allowed.includes(r))) {
      await supabase.auth.signOut();
      return toast.error(`This account doesn't have ${kicker.toLowerCase()} access.`);
    }
    router.navigate({ to: home });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-6 flex justify-center"><BrandLogo height={34} /></Link>
        <div className="soft-card p-7">
          <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{kicker}</div>
          <h1 className="mt-1 font-display text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="e">Email</Label>
              <Input id="e" type="email" required value={email} onChange={(ev) => setEmail(ev.target.value)} />
            </div>
            <div>
              <Label htmlFor="p">Password</Label>
              <Input id="p" type="password" required value={password} onChange={(ev) => setPassword(ev.target.value)} />
            </div>
            <Button type="submit" disabled={busy} className="w-full rounded-full">{busy ? "…" : "Sign in"}</Button>
          </form>
        </div>
        <div className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/portals" className="hover:text-foreground">← All portals</Link>
        </div>
      </div>
    </div>
  );
}
