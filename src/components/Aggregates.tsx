"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { GENRE_MIN_ANIME, STUDIO_MIN_ANIME } from "@/lib/aggregate";

export type YearPoint = { year: number; count: number; mean: number };
export type Rank = { name: string; mean: number; count: number };

const fmt = new Intl.NumberFormat("en");

/* ---------------- Score by year ---------------- */

export function YearChart({ points }: { points: YearPoint[] }) {
  // Drawn at the width it is shown at, so phones get readable type and real spacing instead of a shrunken desktop chart.
  const [W, setW] = useState(760);
  const H = W < 520 ? 270 : 300;
  const pad = { l: 38, r: 10, t: 14, b: 30 };
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const host = ref.current?.parentElement;
    if (!host || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setW(Math.round(Math.max(280, Math.min(760, entry.contentRect.width)))));
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  const lo = 5;
  const hi = 7.5;
  const maxCount = Math.max(...points.map((p) => p.count));
  const first = points[0].year;
  const last = points[points.length - 1].year;
  const x = (yr: number) => pad.l + ((yr - first) / (last - first)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const barH = (c: number) => (c / maxCount) * (W < 520 ? 56 : 70);
  const barW = Math.max(2.5, Math.min(7, ((W - pad.l - pad.r) / points.length) * 0.62));

  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.year).toFixed(1)} ${y(p.mean).toFixed(1)}`).join(" ");
  const idx = hover ?? points.length - 1;
  const cur = points[Math.max(0, Math.min(points.length - 1, idx))];

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const t = ((e.clientX - r.left) / r.width) * W;
    const yr = first + ((t - pad.l) / (W - pad.l - pad.r)) * (last - first);
    const i = points.reduce((best, p, k) => (Math.abs(p.year - yr) < Math.abs(points[best].year - yr) ? k : best), 0);
    setHover(i);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") setHover(Math.max(0, idx - 1));
    else if (e.key === "ArrowRight") setHover(Math.min(points.length - 1, idx + 1));
    else return;
    e.preventDefault();
  };

  const ticks = [5, 6, 7];
  const years = points.filter((p) => p.year % (W < 520 ? 20 : 10) === 0);
  const modern = points.filter((p) => p.count >= 100);
  const best = modern.reduce((a, b) => (b.mean > a.mean ? b : a), modern[0] ?? points[0]);
  const worst = modern.reduce((a, b) => (b.mean < a.mean ? b : a), modern[0] ?? points[0]);
  const latest = points[points.length - 1];

  return (
    <div className="yearchart">
      <div className="year-layout">
      <div>
      <p className="year-readout num" aria-live="polite">
        <strong>{cur.year}</strong>
        <span>{fmt.format(cur.count)} anime</span>
        <span>
          average <b>{cur.mean.toFixed(2)}</b>
        </span>
      </p>
      <svg
        ref={ref}
        className="chart"
        viewBox={`0 0 ${W} ${H}`}
        tabIndex={0}
        role="img"
        aria-label={`Average score by year, ${first} to ${last}. Use the left and right arrow keys to read each year.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 8} y={y(v) + 5} textAnchor="end" className="num">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (
          <rect
            key={p.year}
            className="ybar"
            style={{ ["--i" as string]: i }}
            x={x(p.year) - barW / 2}
            width={barW}
            y={H - pad.b - barH(p.count)}
            height={barH(p.count)}
            opacity={hover === i ? 0.9 : undefined}
          />
        ))}
        {years.map((p) => (
          <text key={p.year} x={x(p.year)} y={H - 8} textAnchor="middle" className="num">
            {p.year}
          </text>
        ))}
        <path className="line" d={path} pathLength={1} />
        <line className="cursor" x1={x(cur.year)} x2={x(cur.year)} y1={pad.t} y2={H - pad.b} />
        <circle className="cursor-dot" cx={x(cur.year)} cy={y(cur.mean)} r="6" />
      </svg>
      <p className="chart-note">The line is the average score. The faint bars are how many anime aired that year.</p>
      </div>
      <dl className="year-aside">
        <div>
          <dt>Best year (100+ anime)</dt>
          <dd className="num">{best.year}, {best.mean.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Weakest year (100+ anime)</dt>
          <dd className="num">{worst.year}, {worst.mean.toFixed(2)}</dd>
        </div>
        <div>
          <dt>Latest full year</dt>
          <dd className="num">{latest.year}, {latest.mean.toFixed(2)}</dd>
        </div>
      </dl>
      </div>
    </div>
  );
}

/* ---------------- Leaderboards ---------------- */

export function Leaderboard({ genres, studios }: { genres: Rank[]; studios: Rank[] }) {
  const [tab, setTab] = useState<"genres" | "studios">("genres");
  const rows = tab === "genres" ? genres : studios;
  const lo = 5.5;
  const hi = Math.max(...rows.map((r) => r.mean));

  return (
    <div className="board">
      <div className="seg" role="tablist" aria-label="Rank by">
        {(["genres", "studios"] as const).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className="seg-btn" onClick={() => setTab(t)}>
            {t === "genres" ? "Genres" : "Studios"}
          </button>
        ))}
      </div>
      <p className="chart-note" style={{ marginTop: 0, marginBottom: 16 }}>
        {tab === "genres" ? `Genres with at least ${GENRE_MIN_ANIME} scored anime` : `Studios with at least ${STUDIO_MIN_ANIME} scored anime`}, ranked by average MAL score. Bars start at 5.5, so they show the gap and not the total.
      </p>
      <ol className="board-list" key={tab}>
        {rows.map((r, i) => (
          <li key={r.name} style={{ ["--i" as string]: i }}>
            <span className="board-name">{r.name}</span>
            <span className="board-track" aria-hidden="true">
              <span className="board-fill" style={{ width: `${((r.mean - lo) / (hi - lo)) * 100}%` }} />
            </span>
            <span className="board-val num">{r.mean.toFixed(2)}</span>
          </li>
        ))}
      </ol>
      <p className="board-foot">
        <Link href="/statistics" className="link-btn">
          Change the minimum ratings, filter by type, or see them all
        </Link>
      </p>
    </div>
  );
}
