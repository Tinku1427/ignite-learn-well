import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Guiding Mentor" }] }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmSent, setConfirmSent] = useState<string | null>(null);

  const routeAfterAuth = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const isAdmin = (data ?? []).some((r) => r.role === "admin");
    router.navigate({ to: isAdmin ? "/admin" : "/dashboard", replace: true });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) routeAfterAuth(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session?.user) {
        routeAfterAuth(session.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, phone },
          },
        });
        if (error) throw error;
        if (data.session?.user) {
          toast.success("Welcome! Let's set you up.");
          router.navigate({ to: "/onboarding" });
        } else {
          // Email confirmation required
          setConfirmSent(email);
          toast.success("Check your email to confirm your account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) await routeAfterAuth(data.user.id);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error(res.error.message ?? "Google sign-in failed");
    // On success, onAuthStateChange listener will redirect.
  };


  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-10 gradient-calm text-primary-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-9 rounded-xl bg-white/20 grid place-items-center"><Sparkles className="size-5" /></div>
          <span className="font-display font-semibold">Guiding Mentor</span>
        </Link>
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">Calm minds. Consistent progress.</h2>
          <p className="mt-3 text-white/90 max-w-md">Your daily companion for JEE / NEET — study, reflect, meditate, and stay on track.</p>
        </div>
        <div className="text-sm text-white/80">© {new Date().getFullYear()} Guiding Mentor</div>
      </div>

      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 md:p-8">
            <h1 className="font-display text-2xl font-semibold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === "signin" ? "Sign in to continue your prep." : "Start your JEE/NEET journey with us."}
            </p>

            <Button onClick={google} variant="outline" className="w-full mt-6 gap-2">
              Continue with Google
            </Button>
            <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={submit} className="space-y-3">
              {mode === "signup" && (
                <>
                  <div>
                    <Label htmlFor="fn">Full name</Label>
                    <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="ph">Phone (for WhatsApp nudges)</Label>
                    <Input id="ph" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="em">Email</Label>
                <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pw">Password</Label>
                <Input id="pw" type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-4 text-sm text-primary hover:underline w-full text-center"
            >
              {mode === "signin" ? "New here? Create an account" : "Already registered? Sign in"}
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
