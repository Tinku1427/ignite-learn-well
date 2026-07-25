import { cn } from "@/lib/utils";
import meditateImg from "@/assets/scenes/meditation.png.asset.json";
import affirmImg from "@/assets/scenes/affirmation.png.asset.json";
import moodImg from "@/assets/scenes/mood.png.asset.json";
import breatheImg from "@/assets/scenes/breathe.png.asset.json";
import journalImg from "@/assets/scenes/journal.png.asset.json";

/**
 * Scene — illustrated set for every wellness surface.
 * meditate / affirm / mood / breathe render curated PNGs; the rest fall back
 * to inline SVG so unstyled surfaces still get palette-matched artwork.
 */

export type SceneKind =
  | "home-morning" | "home-evening"
  | "meditate" | "focus" | "affirm" | "journal" | "mood" | "ambient" | "breathe"
  | "empty";

const IMG_MAP: Partial<Record<SceneKind, { url: string; alt: string }>> = {
  meditate: { url: meditateImg.url, alt: "Person meditating" },
  affirm:   { url: affirmImg.url,   alt: "You are worthy" },
  mood:     { url: moodImg.url,     alt: "Reading a book" },
  breathe:  { url: breatheImg.url,  alt: "Yoga breathing pose" },
  journal:  { url: journalImg.url,  alt: "Reading a book" },
};

export function Scene({ kind, className, size = 220, animate = false }: {
  kind: SceneKind;
  className?: string;
  size?: number;
  animate?: boolean;
}) {
  const img = IMG_MAP[kind];
  if (img) {
    return (
      <div
        className={cn("relative flex items-center justify-center", animate && "scene-hop", className)}
        style={{ width: size, height: size }}
      >
        <img src={img.url} alt={img.alt} className="w-full h-full object-contain" loading="lazy" />
      </div>
    );
  }
  const Cmp = MAP[kind] ?? Fallback;
  return (
    <div
      className={cn("relative", animate && "scene-hop", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Cmp />
    </div>
  );
}

/* -------- shared bits -------- */
const SAGE = "var(--sage)";
const SAGE_SOFT = "var(--sage-soft)";
const DUSK = "var(--dusk)";
const APRICOT = "var(--apricot)";
const SKIN = "#E7C6A2";
const HAIR = "#3B2E24";
const TEE = SAGE;

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img">
      <defs>
        <radialGradient id="sunrise" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor={APRICOT} stopOpacity="0.55" />
          <stop offset="70%" stopColor={SAGE_SOFT} stopOpacity="0.9" />
          <stop offset="100%" stopColor={SAGE_SOFT} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dusk-grad" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor={DUSK} stopOpacity="0.35" />
          <stop offset="70%" stopColor={SAGE_SOFT} stopOpacity="0.9" />
          <stop offset="100%" stopColor={SAGE_SOFT} stopOpacity="0" />
        </radialGradient>
      </defs>
      {children}
    </svg>
  );
}

// A calm face: eyes closed by default. Soft mouth.
function Face({ cx, cy, r = 14, mouth = "smile", hair = "loose" }: {
  cx: number; cy: number; r?: number;
  mouth?: "smile" | "flat";
  hair?: "loose" | "short" | "bun";
}) {
  return (
    <g>
      {/* hair back */}
      {hair === "loose" && <path d={`M${cx - r - 2} ${cy} q0 ${r + 8} ${r + 2} ${r + 12} l${2 * r + 4} 0 q${r + 2} -4 ${r + 2} -${r + 12} z`} fill={HAIR} />}
      {hair === "bun" && <circle cx={cx} cy={cy - r - 4} r={6} fill={HAIR} />}
      <circle cx={cx} cy={cy} r={r} fill={SKIN} />
      {hair === "short" && <path d={`M${cx - r} ${cy - 3} q${r} -${r + 4} ${2 * r} 0 l0 -4 q-${r} -${r} -${2 * r} 0 z`} fill={HAIR} />}
      {hair === "loose" && <path d={`M${cx - r} ${cy - 4} q${r} -${r + 6} ${2 * r} 0 l0 -3 q-${r} -${r} -${2 * r} 0 z`} fill={HAIR} />}
      {/* eyes (closed arcs) */}
      <path d={`M${cx - 6} ${cy - 1} q3 3 6 0`} stroke={HAIR} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d={`M${cx + 2} ${cy - 1} q3 3 6 0`} stroke={HAIR} strokeWidth="1.4" fill="none" strokeLinecap="round" />
      {mouth === "smile"
        ? <path d={`M${cx - 3} ${cy + 5} q3 2 6 0`} stroke={HAIR} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        : <line x1={cx - 2} y1={cy + 5} x2={cx + 4} y2={cy + 5} stroke={HAIR} strokeWidth="1.2" strokeLinecap="round" />}
    </g>
  );
}

/* -------- scenes -------- */

function Meditate() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#dusk-grad)" />
      {/* cushion */}
      <ellipse cx="100" cy="160" rx="55" ry="10" fill={APRICOT} opacity="0.55" />
      {/* crossed legs */}
      <path d="M55 158 Q100 130 145 158 Q120 168 100 160 Q80 168 55 158 Z" fill={TEE} />
      {/* torso */}
      <path d="M75 150 Q75 110 100 108 Q125 110 125 150 Z" fill={TEE} />
      {/* arms resting on knees */}
      <path d="M70 148 Q55 140 62 128" stroke={SKIN} strokeWidth="8" fill="none" strokeLinecap="round" />
      <path d="M130 148 Q145 140 138 128" stroke={SKIN} strokeWidth="8" fill="none" strokeLinecap="round" />
      <Face cx={100} cy={95} r={15} hair="loose" />
    </Wrap>
  );
}

function Focus() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#dusk-grad)" />
      {/* desk */}
      <rect x="40" y="140" width="120" height="8" rx="2" fill={APRICOT} opacity="0.7" />
      <rect x="50" y="148" width="6" height="30" fill={APRICOT} opacity="0.6" />
      <rect x="144" y="148" width="6" height="30" fill={APRICOT} opacity="0.6" />
      {/* laptop */}
      <rect x="82" y="120" width="40" height="22" rx="2" fill={DUSK} />
      <rect x="78" y="140" width="48" height="4" rx="1" fill={DUSK} opacity="0.6" />
      {/* torso */}
      <path d="M78 140 Q78 108 100 105 Q122 108 122 140 Z" fill={TEE} />
      {/* arms to laptop */}
      <path d="M82 130 Q90 130 92 128" stroke={SKIN} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M118 130 Q110 130 108 128" stroke={SKIN} strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* headphones */}
      <path d="M85 78 Q100 62 115 78" stroke={HAIR} strokeWidth="4" fill="none" strokeLinecap="round" />
      <rect x="82" y="78" width="8" height="12" rx="3" fill={HAIR} />
      <rect x="110" y="78" width="8" height="12" rx="3" fill={HAIR} />
      <Face cx={100} cy={90} r={14} hair="short" mouth="flat" />
    </Wrap>
  );
}

function Affirm() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#sunrise)" />
      {/* standing figure */}
      <path d="M85 175 L85 140 Q85 108 100 106 Q115 108 115 140 L115 175 Z" fill={TEE} />
      {/* arms open, palms up */}
      <path d="M85 132 Q70 128 66 118" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M115 132 Q130 128 134 118" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Face cx={100} cy={92} r={14} hair="loose" />
    </Wrap>
  );
}

function Journal() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#sunrise)" />
      {/* book */}
      <rect x="70" y="140" width="60" height="30" rx="3" fill="#fff" stroke={HAIR} strokeWidth="1" />
      <line x1="100" y1="140" x2="100" y2="170" stroke={HAIR} strokeWidth="0.6" />
      <line x1="78" y1="150" x2="94" y2="150" stroke={HAIR} strokeWidth="0.6" />
      <line x1="78" y1="156" x2="94" y2="156" stroke={HAIR} strokeWidth="0.6" />
      <line x1="106" y1="150" x2="122" y2="150" stroke={HAIR} strokeWidth="0.6" />
      {/* torso */}
      <path d="M78 148 Q78 110 100 108 Q122 110 122 148 Z" fill={TEE} />
      {/* arms writing */}
      <path d="M118 142 Q108 148 105 152" stroke={SKIN} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M82 142 Q92 148 96 152" stroke={SKIN} strokeWidth="6" fill="none" strokeLinecap="round" />
      <Face cx={100} cy={94} r={14} hair="bun" />
    </Wrap>
  );
}

function Mood() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#sunrise)" />
      {/* three soft clouds — no faces */}
      <ellipse cx="70" cy="110" rx="22" ry="14" fill={SAGE_SOFT} />
      <ellipse cx="110" cy="90" rx="30" ry="18" fill="#FFE9D6" />
      <ellipse cx="140" cy="120" rx="24" ry="15" fill={SAGE_SOFT} />
      {/* small sun */}
      <circle cx="100" cy="150" r="12" fill={APRICOT} opacity="0.85" />
    </Wrap>
  );
}

function Ambient() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#dusk-grad)" />
      {/* headphones over floating figure */}
      <path d="M78 78 Q100 55 122 78" stroke={HAIR} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="74" y="78" width="10" height="16" rx="4" fill={HAIR} />
      <rect x="116" y="78" width="10" height="16" rx="4" fill={HAIR} />
      <path d="M78 160 Q78 118 100 116 Q122 118 122 160 Z" fill={TEE} />
      <Face cx={100} cy={94} r={14} hair="short" />
      {/* soundwaves */}
      <path d="M40 130 q6 -12 0 -24" stroke={SAGE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M50 138 q10 -20 0 -40" stroke={SAGE} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
      <path d="M160 130 q-6 -12 0 -24" stroke={SAGE} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M150 138 q-10 -20 0 -40" stroke={SAGE} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.6" />
    </Wrap>
  );
}

function HomeMorning() {
  return (
    <Wrap>
      <circle cx="100" cy="130" r="95" fill="url(#sunrise)" />
      {/* sun */}
      <circle cx="100" cy="80" r="20" fill={APRICOT} opacity="0.9" />
      {/* seated figure */}
      <ellipse cx="100" cy="175" rx="50" ry="8" fill={SAGE} opacity="0.35" />
      <path d="M65 172 Q100 145 135 172 Q115 178 100 172 Q85 178 65 172 Z" fill={TEE} />
      <path d="M80 165 Q80 130 100 128 Q120 130 120 165 Z" fill={TEE} />
      <path d="M78 160 Q65 152 70 142" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M122 160 Q135 152 130 142" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Face cx={100} cy={118} r={14} hair="loose" />
    </Wrap>
  );
}

function HomeEvening() {
  return (
    <Wrap>
      <circle cx="100" cy="130" r="95" fill="url(#dusk-grad)" />
      <circle cx="100" cy="80" r="16" fill={DUSK} opacity="0.5" />
      <circle cx="140" cy="60" r="2" fill={APRICOT} />
      <circle cx="60" cy="55" r="2" fill={APRICOT} />
      <circle cx="150" cy="90" r="1.5" fill={APRICOT} />
      <ellipse cx="100" cy="175" rx="50" ry="8" fill={DUSK} opacity="0.25" />
      <path d="M65 172 Q100 145 135 172 Q115 178 100 172 Q85 178 65 172 Z" fill={TEE} />
      <path d="M80 165 Q80 130 100 128 Q120 130 120 165 Z" fill={TEE} />
      <path d="M78 160 Q65 152 70 142" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <path d="M122 160 Q135 152 130 142" stroke={SKIN} strokeWidth="7" fill="none" strokeLinecap="round" />
      <Face cx={100} cy={118} r={14} hair="short" />
    </Wrap>
  );
}

function Breathe() {
  return (
    <Wrap>
      <circle cx="100" cy="120" r="90" fill="url(#dusk-grad)" />
      {/* concentric breathing rings */}
      <circle cx="100" cy="120" r="60" fill={SAGE} opacity="0.18" />
      <circle cx="100" cy="120" r="42" fill={SAGE} opacity="0.28" />
      <circle cx="100" cy="120" r="26" fill={APRICOT} opacity="0.55" />
      {/* small seated figure */}
      <path d="M78 168 Q100 148 122 168 Q112 174 100 170 Q88 174 78 168 Z" fill={TEE} opacity="0.85" />
      <path d="M86 160 Q86 132 100 130 Q114 132 114 160 Z" fill={TEE} opacity="0.85" />
      <Face cx={100} cy={122} r={11} hair="loose" />
    </Wrap>
  );
}

function Fallback() {
  return (
    <Wrap>
      <circle cx="100" cy="100" r="90" fill={SAGE_SOFT} />
    </Wrap>
  );
}

const MAP: Record<SceneKind, () => React.ReactElement> = {
  "home-morning": HomeMorning,
  "home-evening": HomeEvening,
  meditate: Meditate,
  focus: Focus,
  affirm: Affirm,
  journal: Journal,
  mood: Mood,
  ambient: Ambient,
  breathe: Breathe,
  empty: Fallback,
};
