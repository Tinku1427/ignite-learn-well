import { cn } from "@/lib/utils";

/** Touch-safe range slider. iOS Safari handles native <input type="range"> reliably. */
export function TouchSlider({
  value, min = 0, max = 100, step = 1, onChange, className, ariaLabel,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <input
      type="range"
      className={cn("range-native", className)}
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}
