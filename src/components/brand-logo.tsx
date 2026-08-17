import { cn } from "@/lib/utils";

/**
 * Official Guiding Mentor lockup rendered as a text wordmark to avoid external
 * image hosting. Keeps props (className, tone, height) compatible with callers.
 */
export function BrandLogo({
  className,
  tone = "default",
  height = 28,
}: { className?: string; tone?: "default" | "onDark"; height?: number }) {
  const colorClass = tone === "onDark" ? "text-white" : "text-foreground";
  return (
    <div
      className={cn("font-display font-semibold select-none inline-block leading-none", colorClass, className)}
      style={{ height, lineHeight: `${height}px`, fontSize: Math.round(height * 0.72) }}
      aria-label="Guiding Mentor"
    >
      Guiding Mentor
    </div>
  );
}
