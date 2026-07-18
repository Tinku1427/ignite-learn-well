import { useEffect, useState } from "react";
import { Scene, type SceneKind } from "@/components/scene";
import { cn } from "@/lib/utils";

const LINES = [
  "Nicely done.",
  "That's a win — rest a second.",
  "You showed up today. That counts.",
  "One arc fuller. See you at the next one.",
  "Small today. Different by month's end.",
];

/**
 * Celebrate — brief, warm acknowledgement after a core action completes.
 * Dismissible, respects prefers-reduced-motion, never loud, never guilt-trip.
 * `intensity="soft"` for the affirmation tap (which is just "opened").
 */
export function Celebrate({
  scene, open, onClose, next, intensity = "full",
}: {
  scene: SceneKind;
  open: boolean;
  onClose: () => void;
  next?: { label: string; hint?: string; onGo?: () => void };
  intensity?: "full" | "soft";
}) {
  const [line] = useState(() => LINES[Math.floor(Math.random() * LINES.length)]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, intensity === "soft" ? 1200 : 2200);
    return () => clearTimeout(t);
  }, [open, onClose, intensity]);

  if (!open) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center bg-ink/10 backdrop-blur-[2px] page-fade"
    >
      <div
        className="soft-card relative mx-6 max-w-sm px-6 py-5 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto grid place-items-center" style={{ width: 140, height: 140 }}>
          <div className="celebrate-bloom" />
          <Scene kind={scene} size={140} animate={intensity === "full"} />
        </div>
        <p className={cn("mt-2 font-display", intensity === "full" ? "text-lg" : "text-base")}>
          {intensity === "soft" ? "Held." : line}
        </p>
        {next && (
          <p className="mt-1 text-xs text-muted-foreground">
            {next.hint ?? "Ready for the next one when you are — no rush."}
          </p>
        )}
        <button
          onClick={onClose}
          className="mt-3 text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Tap to dismiss
        </button>
      </div>
    </div>
  );
}
