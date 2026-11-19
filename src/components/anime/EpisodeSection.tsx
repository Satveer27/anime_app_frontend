"use client";

import { useState } from "react";
import type { EpisodeAnalysis } from "@/lib/api";
import { integer, pct } from "@/lib/api";
import { DataNote } from "../DataNote";
import { Reveal } from "../Reveal";
import { EpisodeBrowser } from "./EpisodeBrowser";
import { EveryEpisodeChart, TrendChart } from "./EpisodeCharts";

type Props = { data: EpisodeAnalysis | null; title: string; seed: number };

const VERDICT: Record<string, string> = {
  gets_good: "Gets good",
  consistently_good: "Good from the start",
  declines: "Declines",
  flat: "Holds steady",
  insufficient_data: "Not enough scored episodes",
};

const f2 = (n: number | null | undefined) => (n == null ? "n/a" : n.toFixed(2));
const sign = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}`;

function verdictSentence(t: EpisodeAnalysis["trend"]): string {
  switch (t.verdict) {
    case "gets_good":
      return `The smoothed score settles above ${f2(t.threshold)} from episode ${t.turning_point_episode} onward. The average goes from ${f2(t.baseline)} to ${f2(t.mean_after_turning_point)} (${t.change != null ? sign(t.change) : "n/a"}).`;
    case "consistently_good":
      return `It opens around ${f2(t.baseline)} and never drops away from it.`;
    case "declines":
      return `It opens around ${f2(t.baseline)} and the last episodes average ${f2(t.end_mean)}.`;
    case "flat":
      return `Episode scores hover around ${f2(t.baseline)} from start to finish.`;
    default:
      return `Only ${t.scored_episodes} episode${t.scored_episodes === 1 ? " has" : "s have"} a score, which is too few to call a trend.`;
  }
}

export function EpisodeSection({ data, title, seed }: Props) {
  if (!data) {
    return (
      <section id="episodes" className="anime-section" aria-labelledby="ep-title">
        <h2 id="ep-title">Episode by episode</h2>
        <DataNote title="Episode scores could not be loaded." seed={seed}>
          The API did not return episode data for {title}. Try again in a moment.
        </DataNote>
      </section>
    );
  }

  const scored = data.episodes.filter((e) => e.mal_score != null);
  const t = data.trend;

  if (!data.episodes.length || scored.length < 3) {
    return (
      <section id="episodes" className="anime-section" aria-labelledby="ep-title">
        <h2 id="ep-title">Episode by episode</h2>
        <DataNote title="No episode scores for this title." seed={seed}>
          {data.episodes.length === 0
            ? "MyAnimeList has no episode list stored for this entry. That is common for movies, specials and anime that have only just started."
            : `Only ${scored.length} of its ${data.episodes.length} episodes have a score, and the analysis needs at least 3.`}
        </DataNote>
      </section>
    );
  }

  return (
    <section id="episodes" className="anime-section" aria-labelledby="ep-title">
      <Reveal>
        <h2 id="ep-title">Episode by episode</h2>
      </Reveal>

      <Reveal plain className="panel" delay={30}>
        <EpisodeBrowser episodes={data.episodes} best={data.best} worst={data.worst} />
      </Reveal>

      <Reveal className="verdict-wrap">
        <div className={`verdict verdict-${t.verdict}`}>
          <strong>{VERDICT[t.verdict] ?? t.verdict}</strong>
          <p>{verdictSentence(t)}</p>
          {scored.length ? (
            <p className="verdict-scale num">
              For scale: its lowest episode scores {Math.min(...scored.map((e) => e.mal_score as number)).toFixed(2)} and its highest {Math.max(...scored.map((e) => e.mal_score as number)).toFixed(2)}, out of 10.
            </p>
          ) : null}
        </div>
      </Reveal>

      <Reveal plain className="panel ep-chart-panel" delay={40}>
        <TrendChart episodes={data.episodes} trend={t} best={data.best} worst={data.worst} />
      </Reveal>
      <Reveal plain className="panel ep-chart-panel" delay={60}>
        <EveryEpisodeChart episodes={data.episodes} best={data.best} worst={data.worst} />
      </Reveal>

      <EpisodeStats data={data} />
      {data.segments.length > 1 || data.yearly.length > 1 ? <Blocks data={data} /> : null}
    </section>
  );
}

/* ---------------- stat tiles ---------------- */

function EpisodeStats({ data }: { data: EpisodeAnalysis }) {
  const { hook, volatility, filler_comparison: fc, breakdown: bd, best, worst, episodes } = data;
  const nameOf = (n: number) => episodes.find((e) => e.episode_number === n)?.title;
  const swing = volatility ? (volatility.mean_episode_change < 0.15 ? "Very steady" : volatility.mean_episode_change < 0.35 ? "Mostly steady" : "A rollercoaster") : null;

  return (
    <div className="ep-stats">
      {hook ? (
        <Reveal plain className="stat-card" delay={40}>
          <h3>Opening and finale</h3>
          <p className="stat-big num">{sign(hook.hook_difference)}</p>
          <p className="stat-sub">
            The first {hook.first_episodes} episodes average {f2(hook.first_mean)} against {f2(hook.rest_mean)} for the rest.{" "}
            {hook.hook_difference > 0.1 ? "A strong open." : hook.hook_difference < -0.1 ? "It starts weaker than it ends." : "No real difference."}
          </p>
          <p className="stat-sub num">
            Episode {hook.latest_episode} scored {f2(hook.latest_score)}, {sign(hook.latest_vs_rest)} against everything before it.
          </p>
        </Reveal>
      ) : null}

      {volatility ? (
        <Reveal plain className="stat-card" delay={100}>
          <h3>How bumpy is it?</h3>
          <p className="stat-big">{swing}</p>
          <p className="stat-sub num">
            Scores move {volatility.mean_episode_change.toFixed(2)} on average from one episode to the next, and spread {volatility.standard_deviation.toFixed(2)} (standard deviation) overall.
          </p>
        </Reveal>
      ) : null}

      <Reveal plain className="stat-card" delay={160}>
        <h3>Filler and recaps</h3>
        {bd.filler_episodes + bd.recap_episodes === 0 ? (
          <p className="stat-sub">None of its {integer(bd.total_episodes)} episodes are flagged as filler or recap.</p>
        ) : (
          <>
            <div className="mix-bar mix-bar-sm" role="img" aria-label="Share of regular, filler and recap episodes">
              {[
                { w: bd.regular_episodes, c: "var(--teal-line)" },
                { w: bd.filler_episodes, c: "var(--sakura)" },
                { w: bd.recap_episodes, c: "var(--ink-3)" },
              ].map((s, i) => (
                <div key={i} className="mix-seg" style={{ flexGrow: s.w, ["--seg" as string]: s.c, ["--i" as string]: i }} />
              ))}
            </div>
            <p className="stat-sub num">
              {integer(bd.regular_episodes)} regular ({pct(bd.regular_share, 0)}), {integer(bd.filler_episodes)} filler ({pct(bd.filler_share, 0)}), {integer(bd.recap_episodes)} recap ({pct(bd.recap_share, 0)}).
            </p>
            {fc.filler_mean != null && fc.non_filler_mean != null ? (
              <p className="stat-sub num">
                Filler averages {f2(fc.filler_mean)} against {f2(fc.non_filler_mean)} for the rest.
              </p>
            ) : null}
          </>
        )}
      </Reveal>

      {best || worst ? (
        <Reveal plain className="stat-card" delay={220}>
          <h3>Highest and lowest</h3>
          {best ? (
            <p className="stat-sub num">
              <b className="good">Highest {best.mal_score.toFixed(2)}</b>: {best.episode_numbers.slice(0, 3).map((n) => `ep ${n}${nameOf(n) ? ` (${nameOf(n)})` : ""}`).join(", ")}
              {best.episode_numbers.length > 3 ? ` and ${best.episode_numbers.length - 3} more` : ""}
            </p>
          ) : null}
          {worst ? (
            <p className="stat-sub num">
              <b className={worst.mal_score >= 8 ? "" : "bad"}>Lowest {worst.mal_score.toFixed(2)}</b>: {worst.episode_numbers.slice(0, 3).map((n) => `ep ${n}${nameOf(n) ? ` (${nameOf(n)})` : ""}`).join(", ")}
              {worst.episode_numbers.length > 3 ? ` and ${worst.episode_numbers.length - 3} more` : ""}
            </p>
          ) : null}
        </Reveal>
      ) : null}
    </div>
  );
}

/* ---------------- long series: 200-episode blocks and years ---------------- */

function Blocks({ data }: { data: EpisodeAnalysis }) {
  const [mode, setMode] = useState<"years" | "blocks">(data.yearly.length > 1 ? "years" : "blocks");
  const rows =
    mode === "years"
      ? data.yearly.filter((y) => y.mean_score != null).map((y) => ({ label: String(y.year), sub: `${y.scored_episodes} scored of ${y.episode_count}`, v: y.mean_score as number }))
      : data.segments.map((s) => ({ label: `Ep ${s.start_episode}-${s.end_episode}`, sub: `${s.scored_episodes} scored${s.change_from_previous != null ? `, ${sign(s.change_from_previous)} vs previous block` : ""}`, v: s.mean_score }));
  if (!rows.length) return null;
  const lo = Math.min(...rows.map((r) => r.v)) - 0.3;
  const hi = Math.max(...rows.map((r) => r.v));
  return (
    <Reveal plain className="panel" delay={60}>
      <div className="panel-title">
        <strong>{mode === "years" ? "Average score by year aired" : "Average score by block of 200 episodes"}</strong>
        {data.yearly.length > 1 && data.segments.length > 1 ? (
          <span className="seg seg-sm" role="group" aria-label="Group episodes by">
            <button type="button" className="seg-btn" aria-pressed={mode === "years"} onClick={() => setMode("years")}>
              Years
            </button>
            <button type="button" className="seg-btn" aria-pressed={mode === "blocks"} onClick={() => setMode("blocks")}>
              Blocks
            </button>
          </span>
        ) : null}
      </div>
      <ol className="board-list" key={mode}>
        {rows.map((r, i) => (
          <li key={r.label} style={{ ["--i" as string]: Math.min(i, 20) }} className="block-row">
            <span className="board-name num">{r.label}</span>
            <span className="board-track" aria-hidden="true">
              <span className="board-fill" style={{ width: `${((r.v - lo) / (hi - lo || 1)) * 100}%` }} />
            </span>
            <span className="board-val num">{r.v.toFixed(2)}</span>
            <span className="block-sub num">{r.sub}</span>
          </li>
        ))}
      </ol>
      <p className="chart-note">Bars start just below the lowest average, so they show the gap and not the total.</p>
    </Reveal>
  );
}
