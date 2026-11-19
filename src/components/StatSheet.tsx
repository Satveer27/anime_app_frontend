"use client";

import Image from "next/image";
import { useRef, useState, type KeyboardEvent } from "react";

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

const STATUS: { key: keyof Sheet["list"]; label: string; color: string }[] = [
  { key: "completed", label: "Finished", color: "var(--teal-line)" },
  { key: "watching", label: "Watching", color: "var(--ink-2)" },
  { key: "plan_to_watch", label: "Plan to watch", color: "var(--ink-3)" },
  { key: "on_hold", label: "On hold", color: "color-mix(in srgb, var(--ink-3) 50%, var(--surface))" },
  { key: "dropped", label: "Dropped", color: "var(--accent)" },
];

export function StatSheet({ sheets }: { sheets: Sheet[] }) {
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const s = sheets[active];

  const onKey = (e: KeyboardEvent) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!next) return;
    e.preventDefault();
    const i = (active + next + sheets.length) % sheets.length;
    setActive(i);
    tabs.current[i]?.focus();
  };

  const maxPct = Math.max(...s.dist.map((d) => d.percentage));
  const mode = s.dist.reduce((a, b) => (b.percentage > a.percentage ? b : a));

  return (
    <div className="sheet-wrap">
      <div className="sheet-tabs" role="tablist" aria-label="Pick an anime" aria-orientation="vertical" onKeyDown={onKey}>
        {sheets.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={i === active}
            aria-controls="sheet-panel"
            tabIndex={i === active ? 0 : -1}
            className="sheet-tab"
            onClick={() => setActive(i)}
          >
            <span className="sheet-thumb">
              {t.image ? <Image src={t.image} alt="" fill sizes="44px" style={{ objectFit: "cover" }} /> : null}
            </span>
            <span className="sheet-tab-title">{t.title}</span>
          </button>
        ))}
      </div>

      <div className="sheet" role="tabpanel" id="sheet-panel" aria-labelledby={`tab-${s.id}`} key={s.id}>
        <div className="sheet-head">
          <span className="poster sheet-poster">{s.image ? <Image src={s.image} alt={`${s.title} cover`} fill sizes="132px" style={{ objectFit: "cover" }} /> : null}</span>
          <div>
            <h3>{s.title}</h3>
            <p className="sheet-meta num">{s.meta}</p>
          </div>
        </div>

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
          <div className="dist" role="img" aria-label={`Score distribution. Most common score ${mode.score}, ${Math.round(mode.percentage)} percent of votes.`}>
            {s.dist.map((d, i) => (
              <div key={d.score} className="dist-col">
                <span className="dist-val num">{d.percentage >= 4 ? `${Math.round(d.percentage)}%` : ""}</span>
                <span className={`dist-bar${d.percentage === maxPct ? " peak" : ""}`} style={{ height: `calc((100% - 40px) * ${Math.max(0.02, d.percentage / maxPct)})`, ["--i" as string]: i }} />
                <span className="dist-lab num">{d.score}</span>
              </div>
            ))}
          </div>
          <p className="sheet-note num">
            Average {s.mean.toFixed(2)} from {fmt.format(s.totalVotes)} votes. Most common score: {mode.score}.
          </p>
        </div>

        <div className="sheet-block">
          <h4>Where people are with it</h4>
          <div className="status-bar" role="img" aria-label="Share of viewers by list status">
            {STATUS.map((st, i) => (
              <span key={st.key} className="status-seg" style={{ flexGrow: Math.max(s.list[st.key], 1), background: st.color, ["--i" as string]: i }} />
            ))}
          </div>
          <ul className="status-legend">
            {STATUS.map((st) => (
              <li key={st.key}>
                <span className="status-dot" style={{ background: st.color }} />
                <span className="num">{Math.round((s.list[st.key] / s.list.total) * 100)}%</span> {st.label}
              </li>
            ))}
          </ul>
        </div>

        {s.cohort ? (
          <p className="sheet-rank num">
            Ranks <strong>#{fmt.format(s.cohort.rank)}</strong> of {fmt.format(s.cohort.size)} {s.cohort.type} anime from {s.cohort.from === s.cohort.to ? s.cohort.from : `${s.cohort.from} to ${s.cohort.to}`}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
