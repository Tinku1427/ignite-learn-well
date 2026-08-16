import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
  head: () => ({
    meta: [
      { title: "Choose a new password · Guiding Mentor" },
      { name: "description", content: "Set a new password for your Guiding Mentor account and return to your daily practice." },
      { property: "og:title", content: "Choose a new password · Guiding Mentor" },
      { property: "og:description", content: "Set a new password for your Guiding Mentor account and return to your daily practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The reset link creates a recovery session; wait for it before allowing a change.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setReady(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Those two passwords don't match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    router.navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center"><BrandLogo height={34} /></Link>
        <div className="soft-card p-8">
          <h1 className="font-display text-3xl">Choose a new password</h1>
          {!ready ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Open this page from the reset link in your email. If the link expired,{" "}
              <Link to="/forgot-password" className="underline hover:text-foreground">request a new one</Link>.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="p1">New password</Label>
                <Input id="p1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="p2">Confirm password</Label>
                <Input id="p2" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? "Saving…" : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
