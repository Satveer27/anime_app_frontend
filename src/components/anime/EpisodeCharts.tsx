"use client";

import { useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { EpisodeAnalysis, EpisodePoint } from "@/lib/api";
import { ScaleLegend, epColor } from "../Viz";

type Trend = EpisodeAnalysis["trend"];
type Extreme = EpisodeAnalysis["best"];

const f2 = (n: number | null | undefined) => (n == null ? "n/a" : n.toFixed(2));
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "no air date");

/** A smooth curve through the points (Catmull-Rom converted to cubic Beziers). */
function smoothPath(pts: [number, number][]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

function axisRange(scores: number[], extra?: number | null) {
  const lo = Math.floor((Math.min(...scores, extra ?? 99) - 0.1) * 2) / 2;
  const hi = Math.min(10, Math.ceil((Math.max(...scores) + 0.1) * 2) / 2);
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 0.001; v += 0.5) ticks.push(v);
  return { lo, hi: hi === lo ? lo + 1 : hi, ticks };
}

function Readout({ ep }: { ep: EpisodePoint }) {
  return (
    <div className="ep-readout" aria-live="polite">
      <strong className="num">Episode {ep.episode_number}</strong>
      <span className="ep-readout-title">{ep.title ?? "Untitled"}</span>
      <span className="num">
        scored <b style={{ color: ep.mal_score != null ? epColor(ep.mal_score) : undefined }}>{f2(ep.mal_score)}</b>
      </span>
      <span className="num">{date(ep.aired)}</span>
      {ep.filler ? <span className="badge badge-filler">Filler</span> : null}
      {ep.recap ? <span className="badge badge-recap">Recap</span> : null}
    </div>
  );
}

/* ---------------- 1. the smooth trend ---------------- */

export function TrendChart({ episodes, trend, best, worst }: { episodes: EpisodePoint[]; trend: Trend; best: Extreme; worst: Extreme }) {
  const pts = useMemo(() => episodes.filter((e) => e.mal_score != null), [episodes]);
  const W = 760;
  const H = 320;
  const pad = { l: 46, r: 16, t: 24, b: 38 };
  const scores = pts.map((p) => p.mal_score as number);
  const { lo, hi, ticks } = axisRange(scores, trend.baseline);
  const first = pts[0].episode_number;
  const last = pts[pts.length - 1].episode_number;
  const span = Math.max(1, last - first);
  const x = (ep: number) => pad.l + ((ep - first) / span) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);

  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const cur = pts[hover ?? pts.length - 1];

  const curve = smoothPath(pts.filter((p) => p.smoothed_score != null).map((p) => [x(p.episode_number), y(p.smoothed_score as number)]));

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const t = ((e.clientX - r.left) / r.width) * W;
    const ep = first + ((t - pad.l) / (W - pad.l - pad.r)) * span;
    let bi = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].episode_number - ep) < Math.abs(pts[bi].episode_number - ep)) bi = i;
    setHover(bi);
  };
  const onKey = (e: KeyboardEvent) => {
    const i = hover ?? pts.length - 1;
    if (e.key === "ArrowLeft") setHover(Math.max(0, i - 1));
    else if (e.key === "ArrowRight") setHover(Math.min(pts.length - 1, i + 1));
    else if (e.key === "Home") setHover(0);
    else if (e.key === "End") setHover(pts.length - 1);
    else return;
    e.preventDefault();
  };

  const step = span <= 30 ? 5 : span <= 100 ? 10 : span <= 300 ? 25 : span <= 700 ? 100 : 200;
  const xt: number[] = [];
  for (let v = Math.ceil(first / step) * step; v <= last; v += step) xt.push(v);
  if (!xt.includes(first)) xt.unshift(first);
  const tp = trend.turning_point_episode;
  const labelLeft = tp != null && x(tp) > W * 0.55;
  const isExtreme = (ep: number) => best?.episode_numbers.includes(ep) || worst?.episode_numbers.includes(ep);

  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const smoothed = pts.filter((p) => p.smoothed_score != null);
  const stopEvery = Math.max(1, Math.ceil(smoothed.length / 40));
  const stops = smoothed.filter((_, i) => i % stopEvery === 0 || i === smoothed.length - 1);
  const base = H - pad.b;
  const hoverX = x(cur.episode_number);
  const hoverY = y(cur.mal_score as number);
  const bubbleW = 92;
  const bubbleX = Math.max(pad.l, Math.min(W - pad.r - bubbleW, hoverX - bubbleW / 2));
  const bubbleY = Math.max(2, hoverY - 40);
  const area = curve && smoothed.length > 1 ? `${curve} L${x(smoothed[smoothed.length - 1].episode_number).toFixed(1)} ${base} L${x(smoothed[0].episode_number).toFixed(1)} ${base} Z` : "";
  const pill = (label: string, px: number, py: number, anchor: "start" | "end") => {
    const w = label.length * 5.6 + 18;
    return (
      <g className="pill">
        <rect x={anchor === "end" ? px - w : px} y={py - 11} width={w} height={20} rx={10} />
        <text x={anchor === "end" ? px - w + 8 : px + 8} y={py + 3} textAnchor="start" className="num">
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="ep-chart">
      <div className="panel-title">
        <strong>The trend</strong>
        <span className="num">smoothed over {trend.smoothing_window ?? 3} episodes</span>
      </div>
      <Readout ep={cur} />
      <svg
        ref={ref}
        className="chart ep-svg trend-svg"
        viewBox={`0 0 ${W} ${H}`}
        tabIndex={0}
        role="img"
        aria-label={`Smoothed score trend from episode ${first} to ${last}. Use the arrow keys to move between episodes.`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        onKeyDown={onKey}
        onBlur={() => setHover(null)}
      >
        <defs>
          <linearGradient id={`tg${uid}`} gradientUnits="userSpaceOnUse" x1={pad.l} x2={W - pad.r} y1="0" y2="0">
            {stops.map((p) => (
              <stop key={p.episode_number} offset={`${(((x(p.episode_number) - pad.l) / (W - pad.l - pad.r)) * 100).toFixed(1)}%`} stopColor={epColor(p.smoothed_score as number)} />
            ))}
          </linearGradient>
          <linearGradient id={`fd${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id={`mk${uid}`}>
            <rect x="0" y="0" width={W} height={H} fill={`url(#fd${uid})`} />
          </mask>
        </defs>

        {ticks.map((v) => (
          <g key={v}>
            <line className="grid trend-grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 10} y={y(v) + 4} textAnchor="end" className="num">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        {xt.map((v) => (
          <text key={v} x={x(v)} y={H - 12} textAnchor="middle" className="num">
            {v}
          </text>
        ))}

        {trend.threshold != null && trend.threshold <= hi ? (
          <g>
            <line className="trend-ref" x1={pad.l} x2={W - pad.r} y1={y(trend.threshold)} y2={y(trend.threshold)} />
          </g>
        ) : null}
        {trend.baseline != null ? (
          <g>
            <line className="trend-ref" x1={pad.l} x2={W - pad.r} y1={y(trend.baseline)} y2={y(trend.baseline)} />
          </g>
        ) : null}

        {area ? <path className="trend-area" d={area} fill={`url(#tg${uid})`} mask={`url(#mk${uid})`} /> : null}

        {pts.length <= 260
          ? pts.map((p) => (
              <circle key={p.episode_number} className={`dot dot-soft${isExtreme(p.episode_number) ? " dot-extreme" : ""}`} cx={x(p.episode_number)} cy={y(p.mal_score as number)} r={isExtreme(p.episode_number) ? 4.5 : 2.6} style={{ fill: epColor(p.mal_score as number) }} />
            ))
          : null}

        <path className="line trend-line" d={curve} pathLength={1} style={{ stroke: `url(#tg${uid})` }} />

        {trend.threshold != null && trend.threshold <= hi ? pill(`Bar to clear ${trend.threshold.toFixed(2)}`, W - pad.r - 4, y(trend.threshold), "end") : null}
        {trend.baseline != null ? pill(`Opening average ${trend.baseline.toFixed(2)}`, W - pad.r - 4, y(trend.baseline), "end") : null}

        {tp != null ? (
          <g className="trend-turn">
            <line className="marker" x1={x(tp)} x2={x(tp)} y1={pad.t + 16} y2={base} />
            {(() => {
              const sp = smoothed.find((p) => p.episode_number === tp);
              return sp ? <circle className="trend-ring" cx={x(tp)} cy={y(sp.smoothed_score as number)} r="7" /> : null;
            })()}
            {pill(`Turns the corner: episode ${tp}`, x(tp) + (labelLeft ? -6 : 6), pad.t + 4, labelLeft ? "end" : "start")}
          </g>
        ) : null}

        <line className="cursor" x1={hoverX} x2={hoverX} y1={pad.t + 22} y2={base} />
        <circle className="cursor-dot" cx={hoverX} cy={hoverY} r="6" style={{ fill: epColor(cur.mal_score as number) }} />
        <g className="trend-bubble" transform={`translate(${bubbleX} ${bubbleY})`}>
          <rect width={bubbleW} height="26" rx="13" />
          <text x={bubbleW / 2} y="17" textAnchor="middle" className="num">
            Ep {cur.episode_number}: {f2(cur.mal_score)}
          </text>
        </g>
      </svg>
      <p className="chart-note">The thick line is the moving average and shows direction without the week-to-week noise, coloured red to green by score. The small dots are each episode&apos;s own score.</p>
    </div>
  );
}

/* ---------------- 2. every episode, scrolling sideways ---------------- */

export function EveryEpisodeChart({ episodes, best, worst }: { episodes: EpisodePoint[]; best: Extreme; worst: Extreme }) {
  const pts = useMemo(() => episodes.filter((e) => e.mal_score != null), [episodes]);
  const scores = pts.map((p) => p.mal_score as number);
  const { lo, hi, ticks } = axisRange(scores);
  const H = 300;
  const hasYears = pts.some((p) => p.aired);
  const pad = { t: 22, b: hasYears ? 66 : 34, l: 14, r: 24 };
  const step = Math.max(16, 900 / pts.length);
  const W = pad.l + pad.r + (pts.length - 1) * step + 1;
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const x = (i: number) => pad.l + i * step;

  const [hover, setHover] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cur = pts[hover ?? pts.length - 1];
  const curI = hover ?? pts.length - 1;

  const every = [1, 5, 10, 25, 50, 100, 200].find((n) => n * step >= 64) ?? 200;
  const line = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.mal_score as number).toFixed(1)}`).join(" ");
  const long = W > 900;
  const isExtreme = (ep: number) => best?.episode_numbers.includes(ep) || worst?.episode_numbers.includes(ep);

  return (
    <div className="ep-chart">
      <div className="panel-title">
        <strong>Every episode</strong>
        <span className="num">{pts.length} scored{long ? ", scroll sideways" : ""}</span>
      </div>
      <Readout ep={cur} />
      <div className="ec-wrap">
        <svg className="ec-axis" width="40" height={H} aria-hidden="true">
          {ticks.map((v) => (
            <text key={v} x={34} y={y(v) + 4} textAnchor="end" className="num">
              {v.toFixed(1)}
            </text>
          ))}
        </svg>
        <div
          ref={scroller}
          className="ec-scroll"
          tabIndex={0}
          role="region"
          aria-label={`Every scored episode as a dot, coloured by score. ${long ? "Scroll sideways to see them all." : ""}`}
          onPointerLeave={() => setHover(null)}
        >
          <svg className="ec-svg" width={W} height={H} role="img" aria-label="Dot and line chart of every episode's score">
            {ticks.map((v) => (
              <line key={v} className="grid" x1={0} x2={W} y1={y(v)} y2={y(v)} />
            ))}
            {pts.map((p, i) =>
              i % every === 0 ? (
                <text key={p.episode_number} x={x(i)} y={hasYears ? H - 42 : H - 10} textAnchor="middle" className="num">
                  {p.episode_number}
                </text>
              ) : null,
            )}
            {hasYears
              ? pts.map((p, i) => {
                  const yr = p.aired ? new Date(p.aired).getUTCFullYear() : null;
                  const prev = i > 0 && pts[i - 1].aired ? new Date(pts[i - 1].aired as string).getUTCFullYear() : null;
                  if (yr == null || (i > 0 && yr === prev)) return null;
                  return (
                    <g key={`yr${i}`} className="ec-year">
                      <line x1={x(i)} x2={x(i)} y1={H - 34} y2={H - 26} />
                      <text x={x(i)} y={H - 9} textAnchor={i === 0 ? "start" : "middle"} className="num">
                        {yr}
                      </text>
                    </g>
                  );
                })
              : null}
            <path className="ec-line" d={line} />
            <line className="cursor" x1={x(curI)} x2={x(curI)} y1={pad.t} y2={H - pad.b} />
            {pts.map((p, i) => (
              <circle
                key={p.episode_number}
                className={`ec-dot${curI === i ? " is-on" : ""}${isExtreme(p.episode_number) ? " dot-extreme" : ""}`}
                cx={x(i)}
                cy={y(p.mal_score as number)}
                r={curI === i ? 7 : isExtreme(p.episode_number) ? 5.5 : 4.5}
                style={{ fill: epColor(p.mal_score as number) }}
              />
            ))}
            {pts.map((p, i) => (
              <rect key={`h${p.episode_number}`} x={x(i) - step / 2} y={0} width={step} height={H} fill="transparent" onPointerEnter={() => setHover(i)} onClick={() => setHover(i)} />
            ))}
          </svg>
        </div>
      </div>
      <div className="ec-foot">
        <ScaleLegend />
      </div>
    </div>
  );
}
