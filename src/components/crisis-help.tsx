import { Phone, X } from "lucide-react";
import { HELPLINES } from "@/lib/crisis";
import { cn } from "@/lib/utils";

/**
 * Calm, warm helpline card. Never an alarming interstitial.
 * Shown after a crisis signal, and available any time from the student footer.
 */
export function CrisisHelp({
  onDismiss,
  className,
  tone = "flagged",
}: { onDismiss?: () => void; className?: string; tone?: "flagged" | "always" }) {
  return (
    <div className={cn("soft-card relative border-primary/25 bg-secondary/60 p-5", className)}>
      {onDismiss && (
        <button
          aria-label="Close"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-card"
        >
          <X className="size-4" />
        </button>
      )}
      <h3 className="font-display text-xl">
        {tone === "flagged" ? "That sounded heavy. You don't have to hold it alone." : "Want to talk to someone right now?"}
      </h3>
      <p className="mt-1.5 max-w-prose text-sm text-muted-foreground">
        Talking to a trained person helps, and it's free. Both lines below are confidential and open
        every hour of every day.
      </p>

      <ul className="mt-4 space-y-2">
        {HELPLINES.map((h) => (
          <li key={h.number}>
            <a
              href={h.tel}
              className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 transition-colors hover:bg-card/70"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{h.name}</span>
                <span className="block text-xs text-muted-foreground">{h.note}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary">
                <Phone className="size-4" /> {h.number}
              </span>
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-muted-foreground">
        If you are in immediate danger, call 112 or tell an adult you trust right now.
      </p>
    </div>
  );
}
