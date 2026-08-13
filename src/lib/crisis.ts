import { supabase } from "@/integrations/supabase/client";

/**
 * Crisis-signal detection for free-text a student writes (journal, mood note).
 * Deliberately simple, deliberately over-inclusive: a false positive only shows
 * a warm helpline card, a false negative could miss a child in danger.
 * The app never counsels — it surfaces the helpline and flags a human.
 */
const PATTERNS: RegExp[] = [
  /\bkill (myself|me)\b/i,
  /\bkilling myself\b/i,
  /\bsuicid(e|al)\b/i,
  /\bend (my|it all|this) (life|all)?\b/i,
  /\b(want|going|plan) to die\b/i,
  /\bbetter off dead\b/i,
  /\bdon'?t want to (live|be here|exist)\b/i,
  /\bno (point|reason) (in|to) (living|life|going on)\b/i,
  /\b(cut|cutting|hurt|harm)(ing)? myself\b/i,
  /\bself[- ]harm\b/i,
  /\b(hang|overdose|jump off)\b/i,
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\bnobody (would|will) (care|miss me)\b/i,
  /\bcan'?t (go on|do this any ?more|take it any ?more)\b/i,
  /\bdisappear forever\b/i,
];

export function detectCrisis(text: string | null | undefined): boolean {
  if (!text) return false;
  return PATTERNS.some((re) => re.test(text));
}

/**
 * Records a crisis flag so the coach + admin views can pin this student.
 * Never stores the raw text — the journal stays a private vault.
 */
export async function flagCrisis(
  userId: string,
  source: "journal" | "mood",
): Promise<void> {
  try {
    await supabase.from("agent_events").insert({
      user_id: userId,
      event_type: "crisis_flag",
      detail: { source, at: new Date().toISOString() },
    });
  } catch {
    // Never block the student's save on telemetry.
  }
}

export const HELPLINES = [
  { name: "Tele-MANAS", number: "14416", tel: "tel:14416", note: "Government of India · free · 24/7" },
  { name: "KIRAN", number: "1800-599-0019", tel: "tel:18005990019", note: "Free · 24/7 · multilingual" },
] as const;
