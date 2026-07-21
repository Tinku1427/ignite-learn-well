import avatar from "@/assets/icons/avatar.png.asset.json";
import mentor from "@/assets/icons/mentor.png.asset.json";
import chart from "@/assets/icons/chart.png.asset.json";
import checklist from "@/assets/icons/checklist.png.asset.json";
import check from "@/assets/icons/check.png.asset.json";
import dashboard from "@/assets/icons/dashboard.png.asset.json";
import { cn } from "@/lib/utils";

const MAP = { avatar, mentor, chart, checklist, check, dashboard } as const;
export type AppIconName = keyof typeof MAP;

/**
 * Line-icon glyph. Uses currentColor-friendly filter so it tints
 * against the warm dawn palette instead of appearing raw black.
 */
export function AppIcon({
  name,
  size = 20,
  className,
  tone = "muted",
}: {
  name: AppIconName;
  size?: number;
  className?: string;
  tone?: "muted" | "primary" | "ink";
}) {
  const src = MAP[name].url;
  const filter =
    tone === "primary"
      ? "brightness(0) saturate(100%) invert(38%) sepia(18%) saturate(720%) hue-rotate(85deg) brightness(92%) contrast(85%)"
      : tone === "ink"
      ? "brightness(0) saturate(100%) invert(14%)"
      : "brightness(0) saturate(100%) invert(46%)";
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      style={{ filter }}
      className={cn("inline-block shrink-0", className)}
    />
  );
}
