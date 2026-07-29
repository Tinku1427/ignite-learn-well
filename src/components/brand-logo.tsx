import logo from "@/assets/brand/gm-logo-black.png.asset.json";
import { cn } from "@/lib/utils";

/**
 * Official Guiding Mentor lockup.
 * The supplied artwork is black-on-white; `tone="onDark"` inverts it so it can
 * sit on the brand blue without a white plate.
 */
export function BrandLogo({
  className,
  tone = "default",
  height = 28,
}: { className?: string; tone?: "default" | "onDark"; height?: number }) {
  return (
    <img
      src={logo.url}
      alt="Guiding Mentor"
      style={{ height }}
      className={cn(
        "w-auto select-none object-contain mix-blend-multiply",
        tone === "onDark" && "invert mix-blend-screen",
        className,
      )}
      loading="eager"
      decoding="async"
    />
  );
}
