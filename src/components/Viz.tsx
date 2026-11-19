"use client";

import { useState } from "react";
import { EP_SCALE, epColor, voteColor } from "@/lib/colors";

export { epColor, voteColor };

/* colour scales live in lib/colors so server components can use them too */

/** The stops of the episode scale as a legend. */
export function ScaleLegend({ label = "Episode score" }: { label?: string }) {
  return (
    <div className="scale-legend" aria-label={`${label} colour key: red is low, green is high`}>
      <span className="num">6.5 or lower</span>
      <span className="scale-swatches" aria-hidden="true">
        {EP_SCALE.map((v) => (
          <i key={v} style={{ background: epColor(v) }} />
        ))}
      </span>
      <span className="num">9.5 or higher</span>
      <span className="scale-none" aria-hidden="true">
        <i /> no score
      </span>
    </div>
  );
}

/* ---------------- score distribution ---------------- */

export type Bucket = { score: number; percentage: number | null };

/** Ten bars coloured red to green by score. Hovering one lights it up and dims the rest. */
export function ScoreDist({ buckets, mode }: { buckets: Bucket[]; mode: number | null }) {
  const [on, setOn] = useState<number | null>(null);
  const max = Math.max(...buckets.map((b) => b.percentage ?? 0), 0.0001);
  const hot = on != null ? buckets.find((b) => b.score === on) : null;

  return (
    <div className="dist-wrap">
      <p className="dist-readout num" aria-live="polite">
        {hot ? (
          <>
            <b>{hot.percentage != null ? `${hot.percentage.toFixed(1)}%` : "n/a"}</b> of voters gave it a <b>{hot.score}</b>
          </>
        ) : (
          <>Most common score: {mode ?? "n/a"}</>
        )}
      </p>
      <div
        className="dist"
        data-active={on != null}
        role="img"
        aria-label={`Score distribution, most common score ${mode ?? "unknown"}`}
        onPointerLeave={() => setOn(null)}
      >
        {buckets.map((d, i) => {
          const share = d.percentage ?? 0;
          return (
            <div
              key={d.score}
              className={`dist-col${on === d.score ? " is-on" : ""}`}
              tabIndex={0}
              onPointerEnter={() => setOn(d.score)}
              onFocus={() => setOn(d.score)}
              onBlur={() => setOn(null)}
              aria-label={`${d.score}: ${share.toFixed(1)} percent of votes`}
            >
              <span className="dist-val num">{share >= 4 || on === d.score ? `${Math.round(share)}%` : ""}</span>
              <span
                className="dist-bar"
                style={{ height: `calc((100% - 40px) * ${Math.max(0.02, share / max)})`, background: voteColor(d.score), ["--i" as string]: i }}
              />
              <span className="dist-lab num">{d.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- list status ---------------- */

export type ListCounts = { completed: number; watching: number; plan_to_watch: number; on_hold: number; dropped: number; total: number };

const STATUS = [
  { key: "completed", label: "Finished", color: "hsl(125 52% 50%)" },
  { key: "watching", label: "Watching", color: "hsl(168 46% 46%)" },
  { key: "plan_to_watch", label: "Plan to watch", color: "hsl(48 66% 56%)" },
  { key: "on_hold", label: "On hold", color: "hsl(28 70% 56%)" },
  { key: "dropped", label: "Dropped", color: "hsl(2 66% 54%)" },
] as const;

/** Where members are with it: one bar, coloured by what the status means. Hover a segment or its label. */
export function StatusBar({ list }: { list: ListCounts }) {
  const [on, setOn] = useState<string | null>(null);
  return (
    <div className="status" data-active={on != null}>
      <div className="status-bar" role="img" aria-label="Share of members by list status" onPointerLeave={() => setOn(null)}>
        {STATUS.map((st, i) => (
          <span
            key={st.key}
            className={`status-seg${on === st.key ? " is-on" : ""}`}
            style={{ flexGrow: Math.max(list[st.key], 1), background: st.color, ["--i" as string]: i }}
            onPointerEnter={() => setOn(st.key)}
          />
        ))}
      </div>
      <ul className="status-legend">
        {STATUS.map((st) => (
          <li
            key={st.key}
            className={on === st.key ? "is-on" : undefined}
            tabIndex={0}
            onPointerEnter={() => setOn(st.key)}
            onPointerLeave={() => setOn(null)}
            onFocus={() => setOn(st.key)}
            onBlur={() => setOn(null)}
          >
            <span className="status-dot" style={{ background: st.color }} />
            <span className="num">{list.total ? Math.round((list[st.key] / list.total) * 100) : 0}%</span> {st.label}
            <span className="status-count num"> ({new Intl.NumberFormat("en").format(list[st.key])})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
