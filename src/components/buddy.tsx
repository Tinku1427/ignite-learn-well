import neutral from "@/assets/mascot-neutral.png";
import encouraging from "@/assets/mascot-encouraging.png";
import concerned from "@/assets/mascot-concerned.png";
import celebrating from "@/assets/mascot-celebrating.png";
import { cn } from "@/lib/utils";

const SRC = { neutral, encouraging, concerned, celebrating };

export function Buddy({ mood = "neutral", size = 96, bob = true, className }: {
  mood?: keyof typeof SRC;
  size?: number;
  bob?: boolean;
  className?: string;
}) {
  return (
    <img
      src={SRC[mood]}
      alt="Buddy the owl"
      width={size}
      height={size}
      className={cn("select-none", bob && "buddy-bob", className)}
      draggable={false}
    />
  );
}
