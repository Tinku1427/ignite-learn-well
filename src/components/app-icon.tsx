import { cn } from "@/lib/utils";

/**
 * AppIcon — one consistent inline-SVG glyph set for the whole app.
 * Drawn with a single 1.6 stroke weight on currentColor so every surface
 * (student, coach, mentor, admin) reads as the same illustration family.
 */
export type AppIconName = "avatar" | "mentor" | "chart" | "checklist" | "check" | "dashboard";

const PATHS: Record<AppIconName, JSX.Element> = {
  avatar: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20c.8-3.6 3.9-5.6 7.5-5.6s6.7 2 7.5 5.6" />
    </>
  ),
  mentor: (
    <>
      <circle cx="8" cy="8.5" r="3" />
      <circle cx="16.5" cy="10" r="2.4" />
      <path d="M2.8 19.5c.7-3.1 3.2-4.9 5.9-4.9 1.7 0 3.2.6 4.3 1.7" />
      <path d="M13.6 19.5c.4-2.2 1.9-3.6 3.9-3.6 1.7 0 3.1 1 3.7 2.7" />
    </>
  ),
  chart: (
    <>
      <path d="M3.5 19.5h17" />
      <path d="M5 15.5l4-4.5 3.2 3 5.8-6.5" />
      <path d="M14.4 7.5h4.2v4.2" />
    </>
  ),
  checklist: (
    <>
      <rect x="4" y="3.5" width="16" height="17" rx="3" />
      <path d="M8 9l1.6 1.6L12.4 7.8" />
      <path d="M14.6 9.6h3" />
      <path d="M8 15.4l1.6 1.6 2.8-2.8" />
      <path d="M14.6 16h3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M8.2 12.3l2.6 2.6 5-5.4" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </>
  ),
};

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
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "inline-block shrink-0",
        tone === "primary" && "text-primary",
        tone === "ink" && "text-foreground",
        className,
      )}
    >
      {PATHS[name]}
    </svg>
  );
}
