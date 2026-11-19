"use client";

import { useEffect, useRef, useState } from "react";
import { Chibi, CHIBI_NAMES, type ChibiKind } from "./Chibi";

const LINES: Record<ChibiKind, string[]> = {
  luffy: ["I'm gonna find the best anime!", "Meat first. Then stats.", "Check the drop rate first."],
  naruto: ["Believe it! Slow starts pay off.", "Never skip episode 3.", "Some shows turn the corner late."],
  goku: ["Power level: 9.1!", "Let's see that score distribution!", "Average scores keep creeping up."],
  tanjiro: ["Never drop it before episode 8.", "A score only counts who stayed.", "Take it one episode at a time."],
  gon: ["Hidden gems? Let's hunt!", "Small crowds, big scores.", "Try the ones nobody talks about."],
  jotaro: ["Good grief. Check the score.", "The season barely matters.", "Pick something. Anything."],
  saitama: ["One punch? One episode.", "Click a poster, not me.", "Loosen a filter or two."],
};

type Props = {
  kind: ChibiKind;
  className?: string;
  /** Pop in from below when scrolled into view. */
  pop?: boolean;
  delay?: number;
  /** A sound-effect word shown beside the character. */
  sfx?: string;
};

/** A mascot that pops in on scroll, waves, and says something when poked. */
export function Mascot({ kind, className = "", pop = true, delay = 0, sfx }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [line, setLine] = useState<string | null>(null);
  const [hop, setHop] = useState(0);
  const count = useRef(0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!pop || typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pop]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const poke = () => {
    const lines = LINES[kind];
    setLine(lines[count.current++ % lines.length]);
    setHop((h) => h + 1);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLine(null), 2600);
  };

  return (
    <div ref={ref} className={`mascot mascot-${kind} ${className}`.trim()} style={{ ["--md" as string]: `${delay}ms` }}>
      <button type="button" className="mascot-btn" onClick={poke} aria-label={`Say hi to ${CHIBI_NAMES[kind]}`}>
        <span key={hop} className={hop ? "mascot-body hop" : "mascot-body"}>
          <Chibi kind={kind} />
        </span>
      </button>
      {sfx ? (
        <span className="mascot-sfx jp" aria-hidden="true">
          {sfx}
        </span>
      ) : null}
      <span className="mascot-bubble" role="status" data-show={line ? "true" : "false"}>
        {line}
      </span>
    </div>
  );
}
