import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/protected";
import { WellnessRing } from "@/components/wellness-ring";
import { supabase } from "@/integrations/supabase/client";
import { useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/me")({ component: () => <Protected><Me /></Protected> });

function Me() {
  const router = useRouter();
  const signOut = async () => { await supabase.auth.signOut(); router.navigate({ to: "/" }); };
  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">Me</div>
        <h1 className="font-display text-3xl">Your arc</h1>
      </header>
      <div className="soft-card p-6 flex flex-col items-center">
        <WellnessRing arcs={{ focus: 62, rest: 58, reflection: 70, connection: 45 }} size={180} />
        <p className="mt-4 text-center text-sm text-muted-foreground max-w-xs">The arc across your program will fill in as you practice. Your baseline is saved.</p>
      </div>
      <div className="soft-card p-6">
        <h2 className="font-display text-xl">Your journal is private</h2>
        <p className="mt-2 text-sm text-muted-foreground">Only you can read it. Parents never see it. Coaches only if you tap "share with mentor" on that specific entry.</p>
      </div>
      <Button variant="outline" onClick={signOut} className="w-full rounded-full">Sign out</Button>
    </div>
  );
}
