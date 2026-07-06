import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

export function StreakFlame({ days = 0, className }: { days?: number; className?: string }) {
  const tier =
    days >= 30 ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30"
    : days >= 7 ? "bg-gradient-to-br from-amber-300 to-orange-400 text-white"
    : days >= 3 ? "bg-gradient-to-br from-warm to-accent text-accent-foreground"
    : "bg-secondary text-muted-foreground";
  const scale = days >= 30 ? "size-5" : days >= 7 ? "size-4" : "size-4";
  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium", tier, className)}>
      <Flame className={cn(scale, days >= 7 && "drop-shadow-sm")} />
      <span className="tabular-nums">{days}d</span>
    </div>
  );
}
