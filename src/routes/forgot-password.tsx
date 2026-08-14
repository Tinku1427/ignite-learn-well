import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPassword,
  head: () => ({
    meta: [
      { title: "Reset your password · Guiding Mentor" },
      { name: "description", content: "Send yourself a secure reset link and get back into your Guiding Mentor practice." },
      { property: "og:title", content: "Reset your password · Guiding Mentor" },
      { property: "og:description", content: "Send yourself a secure reset link and get back into your Guiding Mentor practice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setSent(true);
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex justify-center"><BrandLogo height={34} /></Link>

        {sent ? (
          <div className="soft-card p-8 text-center">
            <h1 className="font-display text-2xl">Check your inbox</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              If an account exists for <b>{email}</b>, a reset link is on its way. The link opens a page where you choose a new password.
            </p>
            <Link to="/auth" className="mt-6 inline-block text-sm underline hover:text-foreground">Back to sign in</Link>
          </div>
        ) : (
          <div className="soft-card p-8">
            <h1 className="font-display text-3xl">Forgot your password?</h1>
            <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send a reset link.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? "Sending…" : "Send reset link"}
              </Button>
            </form>
            <div className="mt-5 text-center text-sm text-muted-foreground">
              <Link to="/auth" className="underline hover:text-foreground">Back to sign in</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
