import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) router.navigate({ to: "/home" });
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);

  const google = async () => {
    try { await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Google sign-in failed"); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      setBusy(false);
      if (error) return toast.error(error.message);
      if (!data.session) { setCheckInbox(true); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 block text-center font-display text-xl">Guiding Mentor</Link>

        {checkInbox ? (
          <div className="soft-card p-8 text-center">
            <h2 className="font-display text-2xl">Check your inbox</h2>
            <p className="mt-2 text-sm text-muted-foreground">We sent a confirmation link to <b>{email}</b>. Open it to begin.</p>
          </div>
        ) : (
          <div className="soft-card p-8">
            <h1 className="font-display text-3xl">{mode === "signin" ? "Welcome back" : "Begin your practice"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mode === "signin" ? "Pick up where you left off." : "A minute to set up, a lifetime of quiet."}</p>

            <Button type="button" onClick={google} variant="outline" className="mt-6 w-full rounded-full">Continue with Google</Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />or<div className="h-px flex-1 bg-border" /></div>

            <form onSubmit={submit} className="space-y-4">
              {mode === "signup" && (
                <div>
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Riya" />
                </div>
              )}
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              {mode === "signin" ? "New here? Create an account" : "Have an account? Sign in"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
