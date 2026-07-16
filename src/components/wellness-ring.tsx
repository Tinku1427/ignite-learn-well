import { cn } from "@/lib/utils";

/**
 * WellnessRing — the app's signature element.
 * Four arcs (Focus, Rest, Reflection, Connection). Not a completion meter:
 * arcs fill toward a *healthy* target, so over-full Focus beside empty Rest
 * looks visibly lopsided — that lopsidedness is the whole point.
 *
 * A well-balanced ring gently breathes.
 */

export type WellnessArcs = {
  focus: number;      // 0–100
  rest: number;       // 0–100
  reflection: number; // 0–100
  connection: number; // 0–100
};

const ARCS: Array<{ key: keyof WellnessArcs; label: string; color: string }> = [
  { key: "rest",       label: "Rest",       color: "var(--sage)" },
  { key: "focus",      label: "Focus",      color: "var(--dusk)" },
  { key: "reflection", label: "Reflection", color: "var(--apricot)" },
  { key: "connection", label: "Connection", color: "#7FB8A6" },
];

export function WellnessRing({ arcs, size = 220, showLabels = true, className }: {
  arcs: WellnessArcs;
  size?: number;
  showLabels?: boolean;
  className?: string;
}) {
  const stroke = Math.round(size * 0.08);
  const center = size / 2;
  // Concentric radii, outer → inner
  const radii = ARCS.map((_, i) => center - stroke / 2 - i * (stroke + 4));

  // "Balanced" = every arc within [55, 85] band. Then it breathes.
  const values = ARCS.map((a) => arcs[a.key]);
  const balanced = values.every((v) => v >= 55 && v <= 85);

  return (
    <div className={cn("inline-flex flex-col items-center gap-4", className)}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={cn(balanced && "ring-breathe")}
        role="img"
        aria-label="Wellness ring: rest, focus, reflection, connection"
      >
        {ARCS.map((arc, i) => {
          const r = radii[i];
          const c = 2 * Math.PI * r;
          const v = Math.max(0, Math.min(100, arcs[arc.key]));
          const dash = (v / 100) * c;
          return (
            <g key={arc.key} transform={`rotate(-90 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke="var(--muted)"
                strokeWidth={stroke}
                opacity={0.35}
              />
              <circle
                cx={center}
                cy={center}
                r={r}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${c - dash}`}
                style={{ transition: "stroke-dasharray 600ms ease-out" }}
              />
            </g>
          );
        })}
      </svg>
      {showLabels && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
          {ARCS.map((arc) => (
            <div key={arc.key} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: arc.color }} />
              <span>{arc.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
