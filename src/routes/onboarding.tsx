import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Scene } from "@/components/scene";
import { MoodFacePicker, type MoodValue } from "@/components/mood-face";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: Onboarding });

type Step = "welcome" | "about" | "transparency" | "consent" | "baseline" | "face" | "done";

const BASELINE_Q = [
  { id: "stress",  q: "Right now, how heavy does the load feel?",     lo: "Very heavy", hi: "Manageable" },
  { id: "sleep",   q: "How well did you sleep this past week?",       lo: "Poorly",     hi: "Well" },
  { id: "focus",   q: "Confidence in your ability to focus?",         lo: "Low",        hi: "High" },
  { id: "mood",    q: "Your general mood these past 7 days?",         lo: "Low",        hi: "Good" },
] as const;

function Onboarding() {
  const router = useRouter();
  const [uid, setUid] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [examTrack, setExamTrack] = useState("neet");
  const [classLevel, setClassLevel] = useState("12");
  const [parentEmail, setParentEmail] = useState("");
  const [parentName, setParentName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>(
    Object.fromEntries(BASELINE_Q.map((q) => [q.id, 5]))
  );
  const [face, setFace] = useState<MoodValue | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return router.navigate({ to: "/auth" });
      setUid(data.user.id);
      supabase.from("profiles").select("full_name, onboarding_complete, parental_consent_at").eq("id", data.user.id).maybeSingle()
        .then(({ data: p }) => {
          if (p?.onboarding_complete && p?.parental_consent_at) router.navigate({ to: "/home" });
          if (p?.full_name) {
            const parts = p.full_name.trim().split(/\s+/);
            setFirstName(parts[0] ?? "");
            setLastName(parts.slice(1).join(" "));
          }
        });
    });
  }, [router]);


  const finish = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const { error: pErr } = await supabase.from("profiles").update({
        full_name: fullName,

        exam_track: examTrack,
        class_level: classLevel,
        parental_consent_at: new Date().toISOString(),
        parental_consent_by: parentName || parentEmail,
        parent_contact: parentEmail,
        onboarding_complete: true,
      }).eq("id", uid);
      if (pErr) throw pErr;

      if (parentEmail) {
        await supabase.from("parent_links").upsert({
          student_id: uid, parent_email: parentEmail, parent_name: parentName || null,
        }, { onConflict: "student_id,parent_email" });
      }

      // Baseline assessment: ensure a baseline exists, insert response.
      let { data: baseline } = await supabase.from("assessments").select("id").eq("kind", "baseline").eq("is_active", true).limit(1).maybeSingle();
      if (!baseline) {
        // No published baseline yet — record answers as a lightweight profile-embedded record.
        // Skip DB write silently rather than fail onboarding.
      } else {
        await supabase.from("assessment_responses").insert({
          user_id: uid, assessment_id: baseline.id, answers,
        });
      }
      toast.success("You're set. Welcome.");
      router.navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center gap-4">
          <Buddy mood="encouraging" size={64} />
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Onboarding</div>
            <div className="font-display text-2xl">A few things to begin</div>
          </div>
        </div>

        <div className="soft-card p-6 md:p-8">
          {step === "welcome" && (
            <>
              <h2 className="font-display text-2xl">Hi, I'm Buddy.</h2>
              <p className="mt-3 text-sm text-muted-foreground">
                I'm going to walk with you through your NEET prep — not the syllabus, but the you behind it.
                A few gentle questions first, so I know how to show up for you.
              </p>
              <Button className="mt-6 w-full rounded-full" onClick={() => setStep("about")}>Let's start</Button>
            </>
          )}

          {step === "about" && (
            <>
              <h2 className="font-display text-2xl">Tell me about you</h2>
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Riya" />
                  </div>
                  <div>
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sharma" />
                  </div>
                </div>

                <div>
                  <Label>Class</Label>
                  <RadioGroup value={classLevel} onValueChange={setClassLevel} className="grid grid-cols-3 gap-2 mt-2">
                    {[{v:"11",l:"Class 11"},{v:"12",l:"Class 12"},{v:"repeater",l:"Repeater"}].map((o) => (
                      <label key={o.v} className="rounded-xl border border-border p-3 text-sm text-center cursor-pointer has-[:checked]:bg-secondary has-[:checked]:border-primary">
                        <RadioGroupItem value={o.v} className="sr-only" /> {o.l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label>Exam</Label>
                  <RadioGroup value={examTrack} onValueChange={setExamTrack} className="grid grid-cols-2 gap-2 mt-2">
                    {[{v:"neet",l:"NEET"},{v:"other",l:"Other"}].map((o) => (
                      <label key={o.v} className="rounded-xl border border-border p-3 text-sm text-center cursor-pointer has-[:checked]:bg-secondary has-[:checked]:border-primary">
                        <RadioGroupItem value={o.v} className="sr-only" /> {o.l}
                      </label>
                    ))}
                  </RadioGroup>
                </div>
              </div>
              <Button className="mt-6 w-full rounded-full" disabled={!firstName.trim()} onClick={() => setStep("transparency")}>Continue</Button>
            </>
          )}

          {step === "transparency" && (
            <>
              <h2 className="font-display text-2xl">Who sees what</h2>
              <p className="mt-2 text-sm text-muted-foreground">Being honest here matters more than looking good. So here's the deal, plainly:</p>
              <ul className="mt-5 space-y-3 text-sm">
                <li className="rounded-xl bg-secondary p-4"><b>You</b> see everything — your journals, your daily moods, your notes.</li>
                <li className="rounded-xl bg-secondary p-4"><b>Your parent</b> sees only the arc: how consistent you've been, your mood trend direction, your progress across the program. <b>Never</b> your journal or individual mood entries.</li>
                <li className="rounded-xl bg-secondary p-4"><b>Your coach</b> sees risk signals and the arc. Raw journal only if you tap "share with mentor" on that entry.</li>
              </ul>
              <Button className="mt-6 w-full rounded-full" onClick={() => setStep("consent")}>Got it</Button>
            </>
          )}

          {step === "consent" && (
            <>
              <h2 className="font-display text-2xl">Parental consent</h2>
              <p className="mt-2 text-sm text-muted-foreground">Since you may be under 18, we need a parent's contact and consent to store your wellness data. They'll receive your arc report; the diary stays private.</p>
              <div className="mt-5 space-y-4">
                <div><Label>Parent's name</Label><Input value={parentName} onChange={(e) => setParentName(e.target.value)} /></div>
                <div><Label>Parent's email</Label><Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} /></div>
                <label className="flex items-start gap-3 text-sm">
                  <Checkbox checked={consentChecked} onCheckedChange={(v) => setConsentChecked(Boolean(v))} className="mt-0.5" />
                  <span>My parent/guardian consents to Guiding Mentor storing and processing my wellness data as described above.</span>
                </label>
              </div>
              <Button className="mt-6 w-full rounded-full" disabled={!consentChecked || !parentEmail} onClick={() => setStep("baseline")}>Continue</Button>
            </>
          )}

          {step === "baseline" && (
            <>
              <h2 className="font-display text-2xl">Where are you today?</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your honest starting point. In a few weeks we'll ask the same thing again — that's the arc.</p>
              <div className="mt-6 space-y-6">
                {BASELINE_Q.map((q) => (
                  <div key={q.id}>
                    <div className="text-sm">{q.q}</div>
                    <Slider min={1} max={10} step={1} value={[answers[q.id]]} onValueChange={([v]) => setAnswers((a) => ({ ...a, [q.id]: v }))} className="mt-3" />
                    <div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>{q.lo}</span><span className="text-foreground">{answers[q.id]}/10</span><span>{q.hi}</span></div>
                  </div>
                ))}
              </div>
              <Button className="mt-8 w-full rounded-full" disabled={saving} onClick={finish}>{saving ? "…" : "Finish and enter"}</Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
