import confetti from "canvas-confetti";
import { toast } from "sonner";

const AFFIRMATIONS = [
  "Nice work — that's a win.",
  "Proud of you for showing up.",
  "One step closer. Keep going.",
  "That's progress you can feel.",
  "Small wins stack up. Great job.",
  "You did the thing. 🌱",
];

export function celebrate(message?: string) {
  if (typeof window === "undefined") return;
  const line = message ?? AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
  try {
    confetti({
      particleCount: 60,
      spread: 65,
      startVelocity: 35,
      gravity: 0.9,
      ticks: 160,
      origin: { y: 0.7 },
      colors: ["#4bb6a8", "#f4a261", "#e76f51", "#f6c667", "#7aa4c6"],
      disableForReducedMotion: true,
    });
  } catch {
    /* noop */
  }
  toast.success(line);
}
