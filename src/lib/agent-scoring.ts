/**
 * Wellness Agent — pure scoring logic.
 *
 * Kept free of Supabase/network imports so it can run on the server route and
 * be unit-reasoned about. Every score is 0–100.
 *
 * Focus is deliberately NOT monotonic: grinding 12h a day is a symptom, not an
 * achievement, so the curve peaks around 3–5h tracked and falls away above ~10h.
 */

export type DayKey = string; // YYYY-MM-DD

export type AgentInput = {
  /** minutes of tracked focus per day, last 7 days */
  focusMinutes: Record<DayKey, number>;
  /** sleep hours + quality (1–5) per night, last 7 days */
  sleep: Record<DayKey, { hours: number; quality: number }>;
  /** days with a journal entry */
  journalDays: DayKey[];
  /** mood check-ins: day -> mood score 1–5 */
  mood: Record<DayKey, number>;
  /** any human contact: mentor message, booking, live session attendance */
  connectionEvents: number;
  /** days since the student did anything at all */
  silenceDays: number;
  /** previous composite (yesterday) for drop detection */
  previousComposite: number | null;
  /** focus minutes/day in the 7 days BEFORE the window, for the "up while rest falls" pattern */
  priorFocusPerDay: number | null;
  /** rest score for the previous window */
  priorRest: number | null;
};

export type AgentThresholds = {
  amber_threshold: number;
  watch_threshold: number;
  low_mood_days: number;
  silence_days: number;
  low_sleep_nights: number;
};

export const DEFAULT_THRESHOLDS: AgentThresholds = {
  amber_threshold: 60,
  watch_threshold: 45,
  low_mood_days: 3,
  silence_days: 4,
  low_sleep_nights: 3,
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Non-monotonic focus curve. 0 min → 0. Peak plateau 180–300 min. 600+ min → decays. */
export function focusCurve(minutesPerDay: number): number {
  const m = Math.max(0, minutesPerDay);
  if (m <= 180) return clamp((m / 180) * 88);
  if (m <= 300) return clamp(88 + ((m - 180) / 120) * 12); // 88 → 100
  if (m <= 600) return clamp(100 - ((m - 300) / 300) * 25); // 100 → 75
  return clamp(75 - ((m - 600) / 300) * 45); // grinding: 75 → 30 and below
}

export function scoreFocus(input: AgentInput): number {
  const days = Object.keys(input.focusMinutes);
  const total = days.reduce((s, d) => s + (input.focusMinutes[d] ?? 0), 0);
  const perDay = total / 7; // averaged over the whole window, not just logged days
  return round1(focusCurve(perDay));
}

export function scoreRest(input: AgentInput): number {
  const nights = Object.values(input.sleep);
  if (!nights.length) return 35; // unknown, not zero — absence of data isn't proof of harm
  const per = nights.map((n) => {
    const h = Math.max(0, n.hours);
    // 7.5h is the target; under-sleep punished harder than over-sleep
    const hoursScore = h >= 7 ? Math.max(70, 100 - (h - 8) * 6) : (h / 7) * 85;
    const qualityScore = (Math.max(1, Math.min(5, n.quality)) / 5) * 100;
    return hoursScore * 0.7 + qualityScore * 0.3;
  });
  const avg = per.reduce((a, b) => a + b, 0) / per.length;
  const coverage = Math.min(1, nights.length / 5); // logging 5+ nights = full credit
  return round1(clamp(avg * (0.7 + 0.3 * coverage)));
}

export function scoreReflection(input: AgentInput): number {
  const journal = new Set(input.journalDays).size;
  const moods = Object.keys(input.mood).length;
  const journalPart = Math.min(1, journal / 4) * 55;
  const moodPart = Math.min(1, moods / 5) * 45;
  return round1(clamp(journalPart + moodPart));
}

export function scoreConnection(input: AgentInput): number {
  const e = input.connectionEvents;
  if (e <= 0) return 20;
  return round1(clamp(20 + Math.min(1, e / 4) * 80));
}

export function composite(parts: { rest: number; focus: number; reflection: number; connection: number }) {
  return round1(
    parts.rest * 0.30 + parts.focus * 0.25 + parts.reflection * 0.25 + parts.connection * 0.20,
  );
}

export type AgentResult = {
  focus_score: number;
  rest_score: number;
  reflection_score: number;
  connection_score: number;
  composite: number;
  risk_band: "green" | "amber" | "watch";
  reasons: string[];
};

/** Risk comes from PATTERNS first; the composite is only the floor of the test. */
export function assess(input: AgentInput, t: AgentThresholds = DEFAULT_THRESHOLDS): AgentResult {
  const rest = scoreRest(input);
  const focus = scoreFocus(input);
  const reflection = scoreReflection(input);
  const connection = scoreConnection(input);
  const comp = composite({ rest, focus, reflection, connection });

  const reasons: string[] = [];
  let patternHits = 0;

  const moodDays = Object.keys(input.mood).sort().slice(-5);
  const lowMood = moodDays.filter((d) => (input.mood[d] ?? 5) <= 2).length;
  if (lowMood >= t.low_mood_days) { reasons.push(`Mood 2 or lower on ${lowMood} of the last 5 check-ins`); patternHits++; }

  if (input.silenceDays >= t.silence_days) { reasons.push(`No activity for ${input.silenceDays} days`); patternHits++; }

  const shortNights = Object.values(input.sleep).filter((n) => n.hours < 5).length;
  if (shortNights >= t.low_sleep_nights) { reasons.push(`Under 5h sleep on ${shortNights} nights`); patternHits++; }

  const focusPerDay = Object.values(input.focusMinutes).reduce((a, b) => a + b, 0) / 7;
  if (
    input.priorFocusPerDay != null && input.priorRest != null &&
    input.priorFocusPerDay > 0 &&
    focusPerDay > input.priorFocusPerDay * 1.4 &&
    rest < input.priorRest
  ) { reasons.push("Study time up sharply while rest is falling"); patternHits++; }

  if (input.previousComposite != null && input.previousComposite - comp > 20) {
    reasons.push("Composite dropped more than 20 points"); patternHits++;
  }

  let band: AgentResult["risk_band"] = "green";
  if (patternHits >= 2 || comp < t.watch_threshold) band = "watch";
  else if (patternHits === 1 || comp < t.amber_threshold) band = "amber";

  if (!reasons.length) {
    if (band === "green") reasons.push("Steady week");
    else reasons.push("Composite below the healthy range");
  }

  return {
    focus_score: focus, rest_score: rest, reflection_score: reflection,
    connection_score: connection, composite: comp, risk_band: band, reasons,
  };
}

/** IST-local YYYY-MM-DD for a JS date (the cohort lives in one timezone). */
export function istDateKey(d: Date): string {
  const ist = new Date(d.getTime() + 5.5 * 3600_000);
  return ist.toISOString().slice(0, 10);
}

export function isQuietHour(now: Date, quietStart: string, quietEnd: string): boolean {
  const ist = new Date(now.getTime() + 5.5 * 3600_000);
  const mins = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const toMin = (s: string) => {
    const [h, m] = s.split(":");
    return Number(h) * 60 + Number(m ?? 0);
  };
  const a = toMin(quietStart), b = toMin(quietEnd);
  return a <= b ? mins >= a && mins < b : mins >= a || mins < b;
}
