"use client";

import { useCallback, useRef, useState } from "react";

/** [x, y, rotation, size, bloom delay ms] */
const BLOSSOMS: [number, number, number, number, number][] = [
  [452, 62, 10, 1.05, 0],
  [388, 98, 40, 0.9, 80],
  [318, 84, -20, 1.1, 160],
  [262, 138, 25, 0.95, 240],
  [206, 176, -35, 1.15, 320],
  [150, 226, 15, 0.9, 400],
  [88, 262, -10, 1.05, 480],
  [346, 150, 55, 0.8, 200],
  [232, 232, -50, 0.85, 360],
  [418, 150, -15, 0.75, 120],
  [128, 160, 30, 0.8, 440],
  [40, 318, 0, 0.9, 560],
];

type Fall = { id: number; x: number; y: number; dx: number; r: number };

/** One five-petal blossom with a notched tip, drawn around (0,0). */
const PETAL = "M0 0 C-11 -6 -13 -21 -4.5 -29 L0 -24 L4.5 -29 C13 -21 11 -6 0 0Z";

export function SakuraBranch() {
  const [falling, setFalling] = useState<Fall[]>([]);
  const idRef = useRef(0);

  const shake = useCallback((x: number, y: number) => {
    const burst = Array.from({ length: 3 }, (_, i) => ({
      id: ++idRef.current,
      x: x + (i - 1) * 8,
      y,
      dx: (Math.random() - 0.4) * 90,
      r: (Math.random() - 0.5) * 540,
    }));
    setFalling((f) => [...f.slice(-18), ...burst]);
  }, []);

  return (
    <svg className="sakura" viewBox="0 0 520 380" aria-hidden="true" focusable="false">
      <g className="sakura-sway">
        <path d="M530 34 C440 50 380 70 318 96 C256 124 214 168 150 220 C112 250 70 262 24 330" className="branch" strokeWidth="11" />
        <path d="M388 70 C380 110 362 128 346 150" className="branch" strokeWidth="5" />
        <path d="M262 136 C250 190 244 214 232 232" className="branch" strokeWidth="5" />
        <path d="M206 176 C176 170 150 168 128 160" className="branch" strokeWidth="4" />
        <path d="M388 98 C402 120 410 134 418 150" className="branch" strokeWidth="4" />
        {BLOSSOMS.map(([x, y, rot, size, delay], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${size})`}>
            <g
              className="blossom"
              style={{ ["--bd" as string]: `${delay}ms` }}
              onPointerEnter={() => shake(x, y)}
              onClick={() => shake(x, y)}
            >
              {[0, 72, 144, 216, 288].map((a) => (
                <path key={a} d={PETAL} transform={`rotate(${a})`} className="petal-shape" />
              ))}
              <circle r="5" className="blossom-core" />
              {[0, 72, 144, 216, 288].map((a) => (
                <circle key={a} cx="0" cy="-10" r="1.6" transform={`rotate(${a + 36})`} className="blossom-dot" />
              ))}
            </g>
          </g>
        ))}
      </g>
      {falling.map((f) => (
        <path
          key={f.id}
          d={PETAL}
          className="falling"
          style={{ ["--fx" as string]: `${f.x}px`, ["--fy" as string]: `${f.y}px`, ["--fdx" as string]: `${f.dx}px`, ["--fr" as string]: `${f.r}deg` }}
          onAnimationEnd={() => setFalling((all) => all.filter((p) => p.id !== f.id))}
        />
      ))}
    </svg>
  );
}
