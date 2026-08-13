import { cn } from "@/lib/utils";

/**
 * MoodFace — one consistent five-point SVG face scale used EVERYWHERE a mood
 * face appears (onboarding baseline, mood check-in, before → after arc, history).
 * No system emojis anywhere. Brand-blue palette, flat fill, no shadows.
 * All five faces share the same 64×64 canvas, head radius, stroke weight and
 * baseline, so a row of them aligns perfectly.
 * value: 1 (rough) → 5 (bright).
 */
export type MoodValue = 1 | 2 | 3 | 4 | 5;

const SKIN = "#EBCBA6";        // warm neutral skin
const INK = "#0B1B3A";         // brand ink
const BLUE = "#003C94";        // brand blue
const BLUSH = "#E8A33D";       // warm accent (cheeks)

const LABELS: Record<MoodValue, string> = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Bright",
};

/** Mouth path + brow tilt for each face. Fixed geometry = identical alignment. */
const FACES: Record<MoodValue, { mouth: string; brow: number; cheeks: boolean; halo: number }> = {
  1: { mouth: "M24 45 Q32 37 40 45", brow: 3, cheeks: false, halo: 0.10 },
  2: { mouth: "M24 44 Q32 39 40 44", brow: 2, cheeks: false, halo: 0.14 },
  3: { mouth: "M24 43 L40 43", brow: 0, cheeks: false, halo: 0.18 },
  4: { mouth: "M24 41 Q32 46 40 41", brow: -1, cheeks: true, halo: 0.22 },
  5: { mouth: "M23 40 Q32 49 41 40", brow: -2, cheeks: true, halo: 0.26 },
};

export function MoodFace({
  value,
  size = 56,
  active = false,
  className,
}: { value: MoodValue; size?: number; active?: boolean; className?: string }) {
  const f = FACES[value];
  const eyeY = 30 + f.brow * 0.5;
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("block select-none", className)}
      aria-label={LABELS[value]}
      role="img"
    >
      {/* halo — same radius on every face so the row shares one baseline */}
      <circle cx="32" cy="32" r="30" fill={BLUE} opacity={active ? 0.16 : f.halo * 0.5} />
      {/* head */}
      <circle cx="32" cy="32" r="21" fill={SKIN} />
      <circle cx="32" cy="32" r="21" fill="none" stroke={BLUE} strokeWidth="1.6" opacity="0.5" />
      {/* cheeks */}
      {f.cheeks && (
        <>
          <circle cx="21" cy="37" r="3.2" fill={BLUSH} opacity="0.55" />
          <circle cx="43" cy="37" r="3.2" fill={BLUSH} opacity="0.55" />
        </>
      )}
      {/* brows */}
      <path
        d={`M22 ${25 + f.brow} q4 ${-f.brow - 1.5} 8 0`}
        stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.85"
      />
      <path
        d={`M34 ${25 + f.brow} q4 ${f.brow + 1.5} 8 0`}
        stroke={INK} strokeWidth="1.7" strokeLinecap="round" fill="none" opacity="0.85"
      />
      {/* eyes */}
      {value === 5 ? (
        <>
          <path d={`M22 ${eyeY + 1} q4 -4 8 0`} stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d={`M34 ${eyeY + 1} q4 -4 8 0`} stroke={INK} strokeWidth="2" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="26" cy={eyeY} r="2" fill={INK} />
          <circle cx="38" cy={eyeY} r="2" fill={INK} />
        </>
      )}
      {/* mouth */}
      <path d={f.mouth} stroke={INK} strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function MoodFacePicker({
  value,
  onChange,
  size = 52,
}: { value: MoodValue | null; onChange: (v: MoodValue) => void; size?: number }) {
  const vals: MoodValue[] = [1, 2, 3, 4, 5];
  return (
    <div className="grid grid-cols-5 items-end gap-2">
      {vals.map((v) => {
        const active = value === v;
        const dimmed = value != null && !active;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            aria-pressed={active}
            className={cn(
              "group flex flex-col items-center justify-end rounded-2xl border p-2",
              "motion-safe:transition-all motion-safe:duration-200",
              active
                ? "border-primary bg-sage-soft ring-2 ring-primary/60 shadow-[0_0_0_6px_hsl(var(--ring)/0.10)] motion-safe:scale-105"
                : "border-border hover:bg-secondary/50",
              dimmed && "opacity-60"
            )}
            aria-label={LABELS[v]}
          >
            <MoodFace value={v} size={size} active={active} />
            <span
              className={cn(
                "mt-1 text-[10px] leading-none motion-safe:transition-colors",
                active ? "font-semibold text-primary" : "text-muted-foreground"
              )}
            >
              {LABELS[v]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const MOOD_LABEL = LABELS;
