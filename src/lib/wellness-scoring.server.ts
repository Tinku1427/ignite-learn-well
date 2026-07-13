// Pure scoring logic — no DB access, easy to test.
// Each sub-score is 0–100. Composite is a weighted blend.

export type DayInputs = {
  pomodoroMinutes: number;      // sum of duration_min for the day
  sleepHours: number | null;    // null = not logged
  sleepQuality: number | null;  // 1–5
  journaled: boolean;
  moodLogged: boolean;
  moodScore: number | null;     // 1–5
  mentorTouches: number;        // messages sent/received or bookings on the day
};

export type DayScore = {
  focus: number;
  rest: number;
  reflection: number;
  connection: number;
  composite: number;
  risk_band: "green" | "amber" | "watch";
  reasons: string[];
};

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function scoreDay(i: DayInputs): DayScore {
  // Focus: 90 min = 100. Linear, capped.
  const focus = clamp(Math.round((i.pomodoroMinutes / 90) * 100));

  // Rest: closer to 7.5h = better; quality is a multiplier.
  let rest = 0;
  if (i.sleepHours != null) {
    const gap = Math.abs(i.sleepHours - 7.5);
    const base = clamp(100 - gap * 18); // 7.5h→100, 6h→73, 5h→55, 4h→37
    const qMult = i.sleepQuality ? 0.6 + (i.sleepQuality / 5) * 0.4 : 0.8;
    rest = Math.round(base * qMult);
  }

  // Reflection: journal 60, mood 40. Mood ≤2 keeps points (honesty counts).
  const reflection =
    (i.journaled ? 60 : 0) + (i.moodLogged ? 40 : 0);

  // Connection: 1 touch = 60, 2+ = 100.
  const connection = i.mentorTouches >= 2 ? 100 : i.mentorTouches === 1 ? 60 : 0;

  // Composite: Focus 30, Rest 30, Reflection 25, Connection 15.
  const composite = Math.round(
    focus * 0.3 + rest * 0.3 + reflection * 0.25 + connection * 0.15,
  );

  const reasons: string[] = [];
  if (i.pomodoroMinutes === 0) reasons.push("no_focus");
  if (i.sleepHours == null) reasons.push("no_sleep_log");
  else if (i.sleepHours < 6) reasons.push("short_sleep");
  if (!i.journaled) reasons.push("no_journal");
  if (!i.moodLogged) reasons.push("no_mood");
  else if (i.moodScore != null && i.moodScore <= 2) reasons.push("low_mood");
  if (i.mentorTouches === 0) reasons.push("no_connection");

  const risk_band: DayScore["risk_band"] =
    composite >= 70 ? "green" : composite >= 40 ? "amber" : "watch";

  return { focus, rest, reflection, connection, composite, risk_band, reasons };
}
