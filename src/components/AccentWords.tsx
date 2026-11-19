"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** The first word is what shows with scripts off, to screen readers and with reduced motion. */
  words: string[];
  /** Milliseconds each word stays put before the next one takes over. */
  hold?: number;
};

/** How long the old word takes to blow away, and how far into that the new word starts to arrive. */
const OUT_MS = 2600;
const NEXT_AT = 900;

/** Stable pseudo-random numbers per letter, so server and client markup match. */
const rnd = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/**
 * An accent word that cycles like blossom on the wind. The leaving word lifts off letter by letter and drifts
 * away over a couple of seconds; while it is still falling, petals blow back in and settle into the next word.
 */
export function AccentWords({ words, hold = 4200 }: Props) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (words.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let current = 0;
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => alive && fn(), ms);
      timers.current.push(id);
    };
    const cycle = () => {
      setLeaving(current);
      later(() => {
        current = (current + 1) % words.length;
        setIndex(current);
      }, NEXT_AT);
      later(() => {
        setLeaving(null);
        later(cycle, hold);
      }, OUT_MS);
    };
    later(cycle, hold);
    const pending = timers.current;
    return () => {
      alive = false;
      pending.forEach((id) => window.clearTimeout(id));
      pending.length = 0;
    };
  }, [words, hold]);

  return (
    <span className="aw">
      <span className="sr-only">{words[0]}</span>
      <span className="aw-stage" aria-hidden="true">
        {words.map((w, wi) => {
          const state = wi === leaving ? "out" : wi === index ? "in" : "off";
          return (
            <span key={w} className="aw-word" data-state={state}>
              {Array.from(w).map((ch, i) => (
                <span
                  key={i}
                  className="aw-ch"
                  style={{
                    ["--i" as string]: i,
                    ["--dx" as string]: `${Math.round(60 + rnd(i, 1) * 150)}px`,
                    ["--dy" as string]: `${Math.round(70 + rnd(i, 2) * 130)}px`,
                    ["--r" as string]: `${Math.round((rnd(i, 3) - 0.3) * 420)}deg`,
                    ["--sw" as string]: `${Math.round((rnd(i, 4) - 0.5) * 50)}px`,
                  }}
                >
                  {ch === " " ? " " : ch}
                </span>
              ))}
            </span>
          );
        })}
      </span>
    </span>
  );
}
