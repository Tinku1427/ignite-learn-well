import neutral from "@/assets/mascot-neutral.png";
import encouraging from "@/assets/mascot-encouraging.png";
import celebrating from "@/assets/mascot-celebrating.png";
import concerned from "@/assets/mascot-concerned.png";
import { cn } from "@/lib/utils";

export type MascotMood = "neutral" | "encouraging" | "celebrating" | "concerned";

const SRC: Record<MascotMood, string> = {
  neutral,
  encouraging,
  celebrating,
  concerned,
};

const LABEL: Record<MascotMood, string> = {
  neutral: "Buddy the owl, calm and ready",
  encouraging: "Buddy the owl, cheering you on",
  celebrating: "Buddy the owl, celebrating with you",
  concerned: "Buddy the owl, here for you",
};

export function Mascot({
  mood = "neutral",
  size = 96,
  className,
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  return (
    <img
      src={SRC[mood]}
      alt={LABEL[mood]}
      width={size}
      height={size}
      loading="lazy"
      className={cn("select-none pointer-events-none", className)}
      style={{ width: size, height: size }}
    />
  );
}
