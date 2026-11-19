"use client";

import Image from "next/image";
import Link from "next/link";
import { ScoreDist, StatusBar } from "./Viz";

export type Sheet = {
  id: number;
  title: string;
  image: string | null;
  meta: string;
  score: number | null;
  rank: number | null;
  members: number | null;
  dist: { score: number; percentage: number }[];
  totalVotes: number;
  mean: number;
  list: { completed: number; watching: number; plan_to_watch: number; on_hold: number; dropped: number; total: number };
  dropRate: number;
  cohort: { rank: number; size: number; type: string; from: number; to: number } | null;
};

const fmt = new Intl.NumberFormat("en");
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * One card per anime, stacked: each sticks near the top while the next slides up and over it.
 * (On very short screens the cards simply follow each other.)
 */
export function StatStack({ sheets }: { sheets: Sheet[] }) {
  return (
    <ol className="stack">
      {sheets.map((s, i) => (
        <li key={s.id} className="stack-card" style={{ ["--n" as string]: i, ["--tint" as string]: `${(i % 3) * 3 + 2}%` }}>
          <div className="stack-inner">
            <SheetBody s={s} />
          </div>
        </li>
      ))}
    </ol>
  );
}

/** The stat sheet itself: numbers, score spread, list status, cohort rank. */
export function SheetBody({ s }: { s: Sheet }) {
  const mode = s.dist.reduce((a, b) => (b.percentage > a.percentage ? b : a));
  return (
    <div className="sheet-cols">
      <div className="sheet-left">
        <span className="poster sheet-poster">{s.image ? <Image src={s.image} alt={`${s.title} cover`} fill sizes="170px" style={{ objectFit: "cover" }} /> : null}</span>
        <div className="sheet-id">
          <h3>{s.title}</h3>
          <p className="sheet-meta num">{s.meta}</p>
          {s.cohort ? (
            <p className="sheet-rank num">
              Ranks <strong>#{fmt.format(s.cohort.rank)}</strong> of {fmt.format(s.cohort.size)} {s.cohort.type} anime from {s.cohort.from === s.cohort.to ? s.cohort.from : `${s.cohort.from} to ${s.cohort.to}`}.
            </p>
          ) : null}
          <Link className="sheet-more" href={`/anime/${s.id}`}>
            See every episode and review
          </Link>
        </div>
      </div>

      <div className="sheet-right">
        <dl className="sheet-nums">
          <div>
            <dt>MAL score</dt>
            <dd className="num">{s.score?.toFixed(2) ?? "n/a"}</dd>
          </div>
          <div>
            <dt>Overall rank</dt>
            <dd className="num">{s.rank ? `#${fmt.format(s.rank)}` : "n/a"}</dd>
          </div>
          <div>
            <dt>Members</dt>
            <dd className="num">{s.members ? compact.format(s.members) : "n/a"}</dd>
          </div>
          <div>
            <dt>Drop rate</dt>
            <dd className="num">{(s.dropRate * 100).toFixed(1)}%</dd>
          </div>
        </dl>

        <div className="sheet-block">
          <h4>How people scored it</h4>
          <ScoreDist buckets={s.dist} mode={mode.score} />
          <p className="sheet-note num">
            Average {s.mean.toFixed(2)} from {fmt.format(s.totalVotes)} votes.
          </p>
        </div>

        <div className="sheet-block">
          <h4>Where people are with it</h4>
          <StatusBar list={s.list} />
        </div>
      </div>
    </div>
  );
}
