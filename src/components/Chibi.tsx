/**
 * Fan-made chibi tributes to well-known anime characters, drawn in SVG. Characters belong to their
 * creators and studios; these are small illustrations for a non-commercial portfolio project.
 * Each is recognisable by its signature costume pieces, and every one has a "sad" mood for errors.
 */
export type ChibiKind = "luffy" | "naruto" | "goku" | "tanjiro" | "gon" | "jotaro" | "saitama";
export type ChibiMood = "happy" | "sad";

export const CHIBI_KINDS: ChibiKind[] = ["luffy", "naruto", "goku", "tanjiro", "gon", "jotaro", "saitama"];

export const CHIBI_NAMES: Record<ChibiKind, string> = {
  luffy: "Luffy",
  naruto: "Naruto",
  goku: "Goku",
  tanjiro: "Tanjiro",
  gon: "Gon",
  jotaro: "Jotaro",
  saitama: "Saitama",
};

const INK = "#2a1a1d";

type Look = {
  skin: string;
  /** body and sleeve colours */
  body: string;
  sleeve: string;
  legs: string;
  shoes: string;
  eye: string;
};

const LOOKS: Record<ChibiKind, Look> = {
  luffy: { skin: "#f7d3b0", body: "#d3262a", sleeve: "#f7d3b0", legs: "#2d4c9a", shoes: "#8a5a2b", eye: "#241a1a" },
  naruto: { skin: "#f7d3b0", body: "#f08a2c", sleeve: "#f08a2c", legs: "#f08a2c", shoes: "#2b3f8f", eye: "#2b6fe0" },
  goku: { skin: "#f7d3b0", body: "#f07a1c", sleeve: "#f07a1c", legs: "#f07a1c", shoes: "#2a4aa0", eye: "#241a1a" },
  tanjiro: { skin: "#f7d3b0", body: "#1d1d1d", sleeve: "#1d1d1d", legs: "#2a2430", shoes: "#e8dcc4", eye: "#8a2a30" },
  gon: { skin: "#f1c595", body: "#4f9a3a", sleeve: "#4f9a3a", legs: "#4f9a3a", shoes: "#3a2a22", eye: "#6b3a20" },
  jotaro: { skin: "#f7d3b0", body: "#17171d", sleeve: "#17171d", legs: "#17171d", shoes: "#0e0e12", eye: "#2a6a72" },
  saitama: { skin: "#f7d3b0", body: "#f4d73a", sleeve: "#f4d73a", legs: "#f4d73a", shoes: "#c92a22", eye: "#241a1a" },
};

/* ---------- hair, hats, headbands ---------- */
function Hair({ kind }: { kind: ChibiKind }) {
  switch (kind) {
    case "luffy":
      return (
        <g>
          <path d="M33 56 C33 42 87 42 87 56 L87 62 C82 52 74 48 60 48 C46 48 38 52 33 62Z" fill="#1d1618" />
          <path d="M36 38 C36 8 84 8 84 38Z" fill="#f0cf6a" />
          <rect x="36" y="27" width="48" height="9" fill="#d3262a" />
          <ellipse cx="60" cy="38" rx="45" ry="8" fill="#f0cf6a" stroke="#d6b04a" strokeWidth="2" />
        </g>
      );
    case "naruto":
      return (
        <g>
          <path d="M33 54 L26 36 L40 40 L36 20 L50 32 L56 12 L64 30 L78 18 L78 38 L92 30 L86 46 L87 54 C82 42 72 38 60 38 C48 38 38 42 33 54Z" fill="#f6d24a" />
          <rect x="33" y="41" width="54" height="9" fill="#2b3f8f" />
          <rect x="47" y="41.5" width="26" height="8" rx="2" fill="#c9d1d9" />
          <path d="M56 45.5 a4 4 0 1 1 4 4 a2 2 0 1 1 -2 -2" fill="none" stroke="#5b6672" strokeWidth="1.4" />
        </g>
      );
    case "goku":
      return <path d="M33 54 L24 30 L40 38 L36 6 L52 28 L62 2 L68 28 L86 8 L80 36 L96 32 L87 54 C82 42 72 38 60 38 C48 38 38 42 33 54Z" fill="#1d1618" />;
    case "tanjiro":
      return (
        <g>
          <path d="M33 56 C26 22 58 12 72 20 C90 22 94 40 87 56 C84 44 76 38 64 42 L58 52 L50 40 C42 42 36 48 33 56Z" fill="#4b1f26" />
          <path d="M62 34 q9 -2 13 7 q-7 4 -13 -7Z" fill="#b5382f" />
        </g>
      );
    case "gon":
      return <path d="M33 54 L28 32 L42 40 L44 18 L54 34 L62 14 L68 34 L82 20 L80 40 L92 38 L87 54 C82 42 72 38 60 38 C48 38 38 42 33 54Z" fill="#1d1618" />;
    case "jotaro":
      return (
        <g>
          <path d="M33 52 C31 66 34 72 38 74 L38 56Z M87 52 C89 66 86 72 82 74 L82 56Z" fill="#1d1618" />
          <path d="M33 47 C33 14 87 14 87 47Z" fill="#14141c" />
          <path d="M33 45 L90 45 L104 52 L33 53Z" fill="#14141c" />
          <circle cx="60" cy="31" r="5" fill="#e8b04a" />
          <path d="M72 53 q14 3 14 -8" fill="none" stroke="#1d1618" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "saitama":
      return <path d="M44 36 Q54 29 66 32" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.55" />;
  }
}

/* ---------- face ---------- */
function Face({ kind, look, sad }: { kind: ChibiKind; look: Look; sad: boolean }) {
  const dot = kind === "saitama";
  const narrow = kind === "jotaro";
  const eyeRx = dot ? 2.4 : narrow ? 4 : 3.7;
  const eyeRy = dot ? 2.4 : narrow ? 3 : 5;
  const ey = narrow ? 56 : 55;
  return (
    <g>
      <ellipse cx="49" cy={ey} rx={eyeRx} ry={eyeRy} fill={look.eye === "#241a1a" || dot ? INK : look.eye} />
      <ellipse cx="71" cy={ey} rx={eyeRx} ry={eyeRy} fill={look.eye === "#241a1a" || dot ? INK : look.eye} />
      {!dot && (
        <g fill="#fff">
          <circle cx="50.4" cy={ey - 2} r="1.5" />
          <circle cx="72.4" cy={ey - 2} r="1.5" />
        </g>
      )}
      {kind === "naruto" && (
        <g stroke={INK} strokeWidth="1.4" strokeLinecap="round">
          <path d="M37 60 l8 2 M37 64 l8 0 M37 68 l8 -2 M83 60 l-8 2 M83 64 l-8 0 M83 68 l-8 -2" />
        </g>
      )}
      {kind === "luffy" && <path d="M68 62 q3 4 7 2 M70 60.5 l1.6 5 M73.5 61 l-.5 4.4" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" />}
      {kind === "jotaro" && <path d="M42 49 L56 51 M78 49 L64 51" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
      {kind === "tanjiro" && (
        <g>
          <rect x="30" y="64" width="5" height="11" rx="1.5" fill="#fff" stroke="#c92a22" strokeWidth="1.5" />
          <rect x="85" y="64" width="5" height="11" rx="1.5" fill="#fff" stroke="#c92a22" strokeWidth="1.5" />
        </g>
      )}
      {!dot && kind !== "jotaro" && (
        <g fill="#f08aa0" opacity="0.5">
          <circle cx="42" cy="64" r="4" />
          <circle cx="78" cy="64" r="4" />
        </g>
      )}
      {sad ? (
        <g>
          <path d="M43 46 L55 41 M77 46 L65 41" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M53 71 Q60 64 67 71" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path className="tear tear-a" d="M46 61 q-4 7 0 10 q4 -3 0 -10Z" fill="#7cc8ff" />
          <path className="tear tear-b" d="M74 61 q-4 7 0 10 q4 -3 0 -10Z" fill="#7cc8ff" />
        </g>
      ) : kind === "luffy" ? (
        <g>
          <path d="M48 65 Q60 80 72 65Z" fill="#4a1a1d" />
          <path d="M50 66 H70" stroke="#fff" strokeWidth="2" />
        </g>
      ) : kind === "saitama" ? (
        <path d="M54 68 H66" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      ) : kind === "jotaro" ? (
        <path d="M54 68 Q60 70 66 67" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M53 66 Q60 72 67 66" stroke={INK} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      )}
    </g>
  );
}

/* ---------- body / outfit ---------- */
function Body({ kind, look }: { kind: ChibiKind; look: Look }) {
  switch (kind) {
    case "luffy":
      return (
        <g>
          <path d="M36 118 H84 L88 136 H32Z" fill={look.legs} />
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill={look.body} />
          <path d="M52 81 L60 116 L68 81Z" fill={look.skin} />
        </g>
      );
    case "naruto":
      return (
        <g>
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill={look.body} />
          <rect x="37" y="88" width="7" height="42" fill="#2b3f8f" />
          <rect x="76" y="88" width="7" height="42" fill="#2b3f8f" />
          <path d="M52 80 L60 92 L68 80Z" fill="#2b3f8f" />
        </g>
      );
    case "goku":
      return (
        <g>
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill={look.body} />
          <path d="M50 80 L60 100 L70 80Z" fill="#2a4aa0" />
          <rect x="36" y="112" width="48" height="9" fill="#2a4aa0" />
        </g>
      );
    case "tanjiro":
      return (
        <g>
          <defs>
            <pattern id="tj-check" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#1d1d1d" />
              <rect width="6" height="6" fill="#3f9a63" />
              <rect x="6" y="6" width="6" height="6" fill="#3f9a63" />
            </pattern>
          </defs>
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill="url(#tj-check)" />
          <path d="M52 80 L60 96 L68 80Z" fill="#f2ebdd" />
        </g>
      );
    case "gon":
      return (
        <g>
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill={look.body} />
          <path d="M46 80 L60 94 L74 80 L70 76 L60 82 L50 76Z" fill="#f2e6a0" />
          <rect x="36" y="124" width="48" height="8" fill="#f2e6a0" opacity="0.9" />
        </g>
      );
    case "jotaro":
      return (
        <g>
          <path d="M34 144 C28 92 44 80 60 80 C76 80 92 92 86 144Z" fill={look.body} />
          <path d="M52 80 L60 120 L68 80Z" fill="#23232b" />
          <path d="M45 87 Q60 112 75 87" fill="none" stroke="#e8b04a" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "saitama":
      return (
        <g>
          <path d="M33 86 L24 136 H96 L87 86Z" fill="#f2ebdd" />
          <path d="M36 132 C32 92 44 80 60 80 C76 80 88 92 84 132Z" fill={look.body} />
          <rect x="36" y="112" width="48" height="6" fill="#f2ebdd" />
        </g>
      );
  }
}

/* ---------- arms ---------- */
const SHOULDER_R = "M80 90 C92 86 98 74 98 62";

function HandColor(kind: ChibiKind, look: Look) {
  return kind === "saitama" ? "#c92a22" : look.skin;
}

function Arm({ kind, look, sad }: { kind: ChibiKind; look: Look; sad: boolean }) {
  const hand = HandColor(kind, look);
  if (sad) {
    return (
      <g>
        <path d="M80 90 C90 100 92 108 90 116" stroke={look.sleeve} strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="90" cy="118" r="6" fill={hand} />
      </g>
    );
  }
  if (kind === "naruto" || kind === "goku") {
    // fist pump
    return (
      <g className="chibi-pump">
        <path d="M80 90 C94 88 98 76 92 62" stroke={look.sleeve} strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="91" cy="57" r="7.5" fill={hand} />
      </g>
    );
  }
  if (kind === "jotaro") {
    // pointing straight out
    return (
      <g className="chibi-point">
        <path d="M80 92 L106 80" stroke={look.sleeve} strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="108" cy="79" r="6" fill={hand} />
        <path d="M112 78 L121 74" stroke={hand} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g className="chibi-wave">
      <path d={SHOULDER_R} stroke={look.sleeve} strokeWidth="11" strokeLinecap="round" fill="none" />
      <circle cx="98" cy="58" r="6.5" fill={hand} />
    </g>
  );
}

export function Chibi({ kind, mood = "happy", className }: { kind: ChibiKind; mood?: ChibiMood; className?: string }) {
  const look = LOOKS[kind];
  const sad = mood === "sad";
  const hand = HandColor(kind, look);
  return (
    <svg className={`chibi ${sad ? "chibi-sad" : ""} ${className ?? ""}`.trim()} viewBox="0 0 124 160" aria-hidden="true" focusable="false">
      <ellipse cx="60" cy="152" rx="30" ry="5" fill="#000" opacity="0.18" />
      {/* legs */}
      <rect x="46" y="130" width="10" height="18" rx="4" fill={kind === "luffy" ? look.skin : look.legs} />
      <rect x="64" y="130" width="10" height="18" rx="4" fill={kind === "luffy" ? look.skin : look.legs} />
      <rect x="43" y="144" width="16" height="7" rx="3.5" fill={look.shoes} />
      <rect x="61" y="144" width="16" height="7" rx="3.5" fill={look.shoes} />
      {/* resting arm */}
      <g>
        <path d="M40 90 C32 100 30 108 32 116" stroke={look.sleeve} strokeWidth="11" strokeLinecap="round" fill="none" />
        <circle cx="32" cy="118" r="6" fill={hand} />
      </g>
      <Body kind={kind} look={look} />
      {/* head */}
      <circle cx="60" cy="54" r="27" fill={look.skin} />
      <Face kind={kind} look={look} sad={sad} />
      <Hair kind={kind} />
      <Arm kind={kind} look={look} sad={sad} />
    </svg>
  );
}
