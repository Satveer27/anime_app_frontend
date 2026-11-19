import Link from "next/link";
import Image from "next/image";
import type { EpisodeAnalysis, HiddenGemItem, MostDroppedItem } from "@/lib/api";
import { compact, integer } from "@/lib/api";
import { ChapterNav } from "./ChapterNav";
import { Reveal } from "./Reveal";

export type Gem = HiddenGemItem & { image_url: string | null };

type Props = {
  trendTitle: string;
  trend: EpisodeAnalysis | null;
  dropped: MostDroppedItem[] | null;
  gems: Gem[] | null;
};

const CHAPTERS = [
  { id: "gets-good", label: "Does it get good?" },
  { id: "drop-off", label: "Who walks out" },
  { id: "underrated", label: "Small crowds, big scores" },
];

export function Measure(props: Props) {
  return (
    <section id="measure" className="section" aria-labelledby="measure-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 id="measure-title">A 7.9 tells you very little</h2>
          <p>
            It could be a slow burn that lands in episode eight, or a show half its viewers dropped. Here is what to
            check instead.
          </p>
        </Reveal>

        <div className="measure-grid">
          <ChapterNav items={CHAPTERS} />
          <div className="chapters">
            <GetsGood trend={props.trend} trendTitle={props.trendTitle} />
            <DropOff dropped={props.dropped} />
            <Underrated gems={props.gems} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- 1. Episode trend ---------------- */

function GetsGood({ trend, trendTitle }: Pick<Props, "trend" | "trendTitle">) {
  const pts = trend?.episodes.filter((e) => e.mal_score != null) ?? [];
  const t = trend?.trend;
  return (
    <article id="gets-good" className="chapter">
      <Reveal className="chapter-intro">
        <h3>Does it get good?</h3>
        <p>
          Viewers score every episode. We smooth out the noise and flag the episode where the line starts to climb.
          {t?.turning_point_episode ? ` For ${trendTitle} that is episode ${t.turning_point_episode}.` : ""}
        </p>
      </Reveal>
      {pts.length > 3 && t ? (
        <Reveal plain className="panel" delay={80}>
          <div className="panel-split">
            <EpisodeChart points={pts} turning={t.turning_point_episode} baseline={t.baseline} />
            <div className="panel-aside">
              <div className="panel-title">
                <strong>{trendTitle}</strong>
                <span>Score of each episode</span>
              </div>
              {t.turning_point_episode && t.baseline && t.mean_after_turning_point ? (
                <div className="fact-row">
                  <div className="fact">
                    <strong className="num">Episode {t.turning_point_episode}</strong>
                    <span>where it turns the corner</span>
                  </div>
                  <div className="fact">
                    <strong className="num">
                      {t.baseline.toFixed(2)} to {t.mean_after_turning_point.toFixed(2)}
                    </strong>
                    <span>average score before and after</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </Reveal>
      ) : (
        <Unavailable />
      )}
    </article>
  );
}

type EpPoint = { episode_number: number; mal_score: number | null; smoothed_score: number | null };

function EpisodeChart({ points, turning, baseline }: { points: EpPoint[]; turning: number | null; baseline: number | null }) {
  const W = 560;
  const H = 300;
  const pad = { l: 44, r: 14, t: 28, b: 34 };
  const scores = points.map((p) => p.mal_score as number);
  const lo = Math.floor(Math.min(...scores) * 2) / 2;
  const hi = Math.ceil(Math.max(...scores) * 2) / 2;
  const n = points.length;
  const first = points[0].episode_number;
  const last = points[n - 1].episode_number;
  const x = (ep: number) => pad.l + ((ep - first) / (last - first)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = points
    .map((p, i) => `${i ? "L" : "M"}${x(p.episode_number).toFixed(1)} ${y((p.smoothed_score ?? p.mal_score) as number).toFixed(1)}`)
    .join(" ");
  const ticks: number[] = [];
  for (let v = lo; v <= hi + 0.001; v += 0.5) ticks.push(v);
  const labelLeft = turning != null && x(turning) > W * 0.5;

  return (
    <svg
      className="chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Episode scores from ${lo} to ${hi}${turning ? `, turning point at episode ${turning}` : ""}`}
    >
      {ticks.map((v) => (
        <g key={v}>
          <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
          <text x={pad.l - 10} y={y(v) + 5} textAnchor="end" className="num">
            {v.toFixed(1)}
          </text>
        </g>
      ))}
      {points
        .filter((_, i) => i === 0 || i === n - 1 || (i + 1) % 5 === 0)
        .map((p) => (
          <text key={p.episode_number} x={x(p.episode_number)} y={H - 8} textAnchor="middle" className="num">
            {p.episode_number}
          </text>
        ))}
      {baseline ? (
        <line x1={pad.l} x2={W - pad.r} y1={y(baseline)} y2={y(baseline)} strokeDasharray="2 6" stroke="var(--ink-3)" strokeWidth="1.5" />
      ) : null}
      {baseline ? (
        <text x={W - pad.r} y={y(baseline) + 20} textAnchor="end" className="num">
          Early average {baseline.toFixed(2)}
        </text>
      ) : null}
      {points.map((p) => (
        <circle key={p.episode_number} className="dot" cx={x(p.episode_number)} cy={y(p.mal_score as number)} r="3.5" />
      ))}
      <path className="line" d={path} pathLength={1} />
      {turning ? (
        <g>
          <line className="marker" x1={x(turning)} x2={x(turning)} y1={pad.t - 6} y2={H - pad.b} />
          <text className="marker-label" x={x(turning) + (labelLeft ? -8 : 8)} y={pad.t + 4} textAnchor={labelLeft ? "end" : "start"}>
            Turns the corner: episode {turning}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

/* ---------------- 2. Drop-off ---------------- */

function DropOff({ dropped }: { dropped: MostDroppedItem[] | null }) {
  const rows = dropped?.slice(0, 5) ?? [];
  const max = Math.max(...rows.map((r) => r.drop_rate), 0.01);
  const top = rows[0];
  return (
    <article id="drop-off" className="chapter">
      <Reveal className="chapter-intro">
        <h3>Who walks out</h3>
        <p>
          {top
            ? `${top.title} was started by ${integer(top.started)} people and dropped by ${integer(top.dropped)} of them. `
            : ""}
          A score only describes the people who stayed.
        </p>
      </Reveal>
      {rows.length ? (
        <Reveal plain className="panel" delay={80}>
          <div className="panel-title">
            <strong>Highest drop rates</strong>
            <span>Among anime with a real audience</span>
          </div>
          <ol className="drop-list">
            {rows.map((r, i) => (
              <li key={r.mal_id} className="drop-row" style={{ ["--i" as string]: i }}>
                <div className="drop-meta">
                  <strong>{r.title}</strong>
                  <span className="drop-pct num">{Math.round(r.drop_rate * 100)}%</span>
                </div>
                <div className="drop-track" aria-hidden="true">
                  <div className="drop-fill" style={{ width: `${(r.drop_rate / max) * 100}%` }} />
                </div>
                <span className="drop-sub num">
                  {integer(r.dropped)} of {integer(r.started)} who started it
                  {r.mal_score ? `, scored ${r.mal_score.toFixed(2)}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      ) : (
        <Unavailable />
      )}
    </article>
  );
}

/* ---------------- 3. Hidden gems ---------------- */

function Underrated({ gems }: { gems: Gem[] | null }) {
  return (
    <article id="underrated" className="chapter">
      <Reveal className="chapter-intro">
        <h3>Small crowds, big scores</h3>
        <p>
          Top fifth for score, below the median for audience.
          {gems?.[0] ? ` ${gems[0].title} has ${compact(gems[0].members_mal)} members and a ${gems[0].mal_score.toFixed(2)}.` : ""} For
          when you have watched the famous ones.
        </p>
      </Reveal>
      {gems?.length ? (
        <div className="gems">
          {gems.map((g, i) => (
            <Reveal key={g.mal_id} className="gem" delay={i * 110}>
              <Link href="/explore" aria-label={g.title}>
                <span className="poster">
                  {g.image_url ? (
                    <Image src={g.image_url} alt={`${g.title} cover`} fill sizes="(max-width: 960px) 30vw, 220px" style={{ objectFit: "cover" }} />
                  ) : null}
                  <span className="score-tag num">{g.mal_score.toFixed(2)}</span>
                </span>
                <h4>{g.title}</h4>
                <p className="num">
                  {compact(g.members_mal)} members{g.year ? `, ${g.year}` : ""}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      ) : (
        <Unavailable />
      )}
    </article>
  );
}

function Unavailable() {
  return <p className="unavailable">This chart is unavailable right now. The API did not respond.</p>;
}
