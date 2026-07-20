import { cn } from "@/lib/utils";

/**
 * MoodFace — a five-point face scale in the app's illustration style.
 * Palette-locked to --sage / --dusk / --apricot; matches Scene figures.
 * Used at onboarding baseline and at any transformation checkpoint.
 * value: 1 (rough) → 5 (bright).
 */
export type MoodValue = 1 | 2 | 3 | 4 | 5;

const SKIN = "#E7C6A2";
const INK = "#3B2E24";
const APRICOT = "var(--apricot)";
const SAGE_SOFT = "var(--sage-soft)";

const LABELS: Record<MoodValue, string> = {
  1: "Rough",
  2: "Low",
  3: "Okay",
  4: "Good",
  5: "Bright",
};

function faceGeom(v: MoodValue) {
  // brow tilt + mouth curve, driven from a single scalar
  const t = (v - 3) / 2; // -1 .. 1
  const mouthCurve = 6 * t;        // 6=smile, -6=frown
  const browLift = -2 * t;         // brows relax up as mood rises
  const cheek = v >= 4 ? 0.6 : 0;
  const aura = v >= 4 ? APRICOT : v <= 2 ? "var(--dusk)" : "var(--sage)";
  return { mouthCurve, browLift, cheek, aura };
}

export function MoodFace({
  value,
  size = 56,
  active = false,
  className,
}: { value: MoodValue; size?: number; active?: boolean; className?: string }) {
  const { mouthCurve, browLift, cheek, aura } = faceGeom(value);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("select-none", className)}
      aria-label={LABELS[value]}
      role="img"
    >
      {/* aura */}
      <circle cx="32" cy="32" r="28" fill={aura} opacity={active ? 0.28 : 0.14} />
      {/* head */}
      <circle cx="32" cy="32" r="18" fill={SKIN} />
      {/* cheeks (only for happier faces) */}
      {cheek > 0 && (
        <>
          <circle cx="22" cy="36" r="3" fill={APRICOT} opacity={cheek} />
          <circle cx="42" cy="36" r="3" fill={APRICOT} opacity={cheek} />
        </>
      )}
      {/* eyes */}
      {value === 1 ? (
        <>
          <path d={`M23 ${28 + browLift} l6 3`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          <path d={`M41 ${28 + browLift} l-6 3`} stroke={INK} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <circle cx="25" cy={30 + browLift} r="1.6" fill={INK} />
          <circle cx="39" cy={30 + browLift} r="1.6" fill={INK} />
        </>
      )}
      {/* mouth */}
      <path
        d={`M24 ${42 - mouthCurve / 2} Q32 ${42 + mouthCurve} 40 ${42 - mouthCurve / 2}`}
        stroke={INK}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {active && <circle cx="32" cy="32" r="22" fill="none" stroke={SAGE_SOFT} strokeWidth="2" />}
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
    <div className="grid grid-cols-5 gap-2">
      {vals.map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex flex-col items-center rounded-2xl border p-2 transition-all",
              active ? "border-primary bg-sage-soft scale-105" : "border-border hover:bg-secondary/50"
            )}
            aria-label={LABELS[v]}
          >
            <MoodFace value={v} size={size} active={active} />
            <span className="mt-1 text-[10px] text-muted-foreground">{LABELS[v]}</span>
          </button>
        );
      })}
    </div>
  );
}

export const MOOD_LABEL = LABELS;
