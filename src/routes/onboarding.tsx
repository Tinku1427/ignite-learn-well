import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

function Onboarding() {
  const router = useRouter();
  const [exam, setExam] = useState<"JEE" | "NEET">("JEE");
  const [year, setYear] = useState("2026");
  const [hours, setHours] = useState("4");
  const [breakPref, setBreakPref] = useState("music");
  const [wa, setWa] = useState("yes");
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.navigate({ to: "/auth" });
      else setUserId(data.user.id);
    });
  }, [router]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        exam,
        target_year: Number(year),
        daily_goal_hours: Number(hours),
        break_pref: breakPref,
        whatsapp_opt_in: wa === "yes",
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("You're all set!");
    router.navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-screen grid place-items-center p-4 bg-background">
      <Card className="w-full max-w-lg">
        <CardContent className="p-6 md:p-8 space-y-5">
          <div>
            <h1 className="font-display text-2xl font-semibold">A few quick things</h1>
            <p className="text-sm text-muted-foreground">We'll tailor your plan around this.</p>
          </div>

          <div>
            <Label>Target exam</Label>
            <RadioGroup value={exam} onValueChange={(v) => setExam(v as "JEE" | "NEET")} className="grid grid-cols-2 gap-3 mt-2">
              {(["JEE", "NEET"] as const).map((e) => (
                <label key={e} className="border rounded-xl p-4 cursor-pointer flex items-center gap-3 has-[:checked]:bg-secondary has-[:checked]:border-primary">
                  <RadioGroupItem value={e} /> <span className="font-medium">{e}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target year</Label>
              <Input value={year} onChange={(e) => setYear(e.target.value)} type="number" />
            </div>
            <div>
              <Label>Daily study goal (hours)</Label>
              <Input value={hours} onChange={(e) => setHours(e.target.value)} type="number" min={1} max={16} />
            </div>
          </div>

          <div>
            <Label>Preferred break activity</Label>
            <Select value={breakPref} onValueChange={setBreakPref}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="music">Relaxation music</SelectItem>
                <SelectItem value="breathing">Breathing exercise</SelectItem>
                <SelectItem value="stretch">Quick stretch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>WhatsApp nudges</Label>
            <RadioGroup value={wa} onValueChange={setWa} className="grid grid-cols-2 gap-3 mt-2">
              {[
                { v: "yes", l: "Yes, keep me consistent" },
                { v: "no", l: "No thanks" },
              ].map((o) => (
                <label key={o.v} className="border rounded-xl p-3 cursor-pointer flex items-center gap-3 has-[:checked]:bg-secondary has-[:checked]:border-primary">
                  <RadioGroupItem value={o.v} /> <span className="text-sm">{o.l}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button className="w-full" disabled={saving} onClick={save}>
            {saving ? "Saving…" : "Take me to my dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
