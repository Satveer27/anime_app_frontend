"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import type { EpisodeAnalysis, EpisodePoint } from "@/lib/api";
import { integer } from "@/lib/api";
import { ScaleLegend, epColor } from "../Viz";

type Props = { episodes: EpisodePoint[]; best: EpisodeAnalysis["best"]; worst: EpisodeAnalysis["worst"] };
type SortKey = "order" | "high" | "low";
type Only = "all" | "filler" | "recap";

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "no air date");
const clean = (s: string | null) => (s ? s.replace(/\n+\(Source:.*\)$/s, "").trim() : "");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trim()}...` : s);

/**
 * Every episode at a glance. Cards are coloured by score (red low, green high); hover or focus one for its
 * title, Japanese title and synopsis. A toggle swaps the cards for a plain sortable list.
 */
export function EpisodeBrowser({ episodes, best, worst }: Props) {
  const [view, setView] = useState<"cards" | "list">("cards");
  const [sort, setSort] = useState<SortKey>("order");
  const [only, setOnly] = useState<Only>("all");
  const [shown, setShown] = useState(30);

  const rows = useMemo(() => {
    let r = episodes.filter((e) => (only === "filler" ? e.filler : only === "recap" ? e.recap : true));
    if (sort !== "order") {
      r = r.filter((e) => e.mal_score != null).sort((a, b) => (sort === "high" ? (b.mal_score as number) - (a.mal_score as number) : (a.mal_score as number) - (b.mal_score as number)));
    }
    return r;
  }, [episodes, sort, only]);

  const hasFiller = episodes.some((e) => e.filler);
  const hasRecap = episodes.some((e) => e.recap);
  const scoredCount = episodes.filter((e) => e.mal_score != null).length;

  return (
    <div className="ebrowse">
      <div className="ep-table-bar">
        <h3>{integer(episodes.length)} episodes</h3>
        <div className="ep-table-controls">
          <div className="seg seg-sm" role="group" aria-label="View episodes as">
            <button type="button" className="seg-btn" aria-pressed={view === "cards"} onClick={() => setView("cards")}>
              Cards
            </button>
            <button type="button" className="seg-btn" aria-pressed={view === "list"} onClick={() => setView("list")}>
              List
            </button>
          </div>
          <label className="sr-only" htmlFor="ep-sort">
            Sort episodes
          </label>
          <select id="ep-sort" value={sort} onChange={(e) => { setSort(e.target.value as SortKey); setShown(30); }}>
            <option value="order">Episode order</option>
            <option value="high">Highest score</option>
            <option value="low">Lowest score</option>
          </select>
          {hasFiller || hasRecap ? (
            <div className="seg seg-sm" role="group" aria-label="Show">
              {(["all", ...(hasFiller ? ["filler"] : []), ...(hasRecap ? ["recap"] : [])] as const).map((o) => (
                <button key={o} type="button" className="seg-btn" aria-pressed={only === o} onClick={() => { setOnly(o as Only); setShown(30); }}>
                  {o === "all" ? "All" : o === "filler" ? "Filler" : "Recaps"}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {view === "cards" ? <ScaleLegend /> : null}
      {scoredCount < episodes.length ? (
        <p className="chart-note" style={{ marginTop: 0 }}>
          {integer(episodes.length - scoredCount)} {episodes.length - scoredCount === 1 ? "episode has" : "episodes have"} no score yet, shown in grey.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="unavailable">No episodes match that.</p>
      ) : view === "cards" ? (
        <EpisodeCards rows={rows} best={best} worst={worst} />
      ) : (
        <>
          <EpisodeList rows={rows.slice(0, shown)} best={best} worst={worst} />
          {rows.length > shown ? (
            <div className="more">
              <p className="num">
                Showing {integer(Math.min(shown, rows.length))} of {integer(rows.length)}
              </p>
              <button type="button" className="btn-quiet" onClick={() => setShown((s) => s + 60)}>
                Show more episodes
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

/* ---------------- coloured cards ---------------- */

type Tip = { ep: EpisodePoint; x: number; top: number; above: boolean };

function EpisodeCards({ rows, best, worst }: { rows: EpisodePoint[]; best: Props["best"]; worst: Props["worst"] }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const size = rows.length <= 30 ? 68 : rows.length <= 100 ? 54 : rows.length <= 300 ? 44 : 36;
  const showScore = size >= 44;

  const open = (el: HTMLElement, ep: EpisodePoint) => {
    const g = grid.current;
    if (!g) return;
    const half = Math.min(150, g.clientWidth / 2);
    const x = Math.max(half, Math.min(g.clientWidth - half, el.offsetLeft + el.offsetWidth / 2));
    const above = el.offsetTop > g.clientHeight * 0.55 && g.clientHeight > 260;
    setTip({ ep, x, top: above ? el.offsetTop - 8 : el.offsetTop + el.offsetHeight + 8, above });
  };

  const onEnter = (e: PointerEvent<HTMLButtonElement>, ep: EpisodePoint) => {
    if (e.pointerType === "mouse") open(e.currentTarget, ep);
  };

  return (
    <div className={rows.length > 150 ? "egrid-scroll" : undefined} tabIndex={rows.length > 150 ? 0 : undefined} role={rows.length > 150 ? "region" : undefined} aria-label={rows.length > 150 ? "Episode cards, scroll to see them all" : undefined}>
    <div
      ref={grid}
      className="egrid"
      style={{ ["--cell" as string]: `${size}px` }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setTip(null);
      }}
    >
      {rows.map((e) => {
        const isBest = best?.episode_numbers.includes(e.episode_number);
        const isWorst = worst?.episode_numbers.includes(e.episode_number);
        const flag = e.filler ? "filler" : e.recap ? "recap" : undefined;
        return (
          <button
            key={e.episode_number}
            type="button"
            className={`ecell${e.mal_score == null ? " is-none" : ""}${isBest ? " is-best" : ""}${isWorst ? " is-worst" : ""}`}
            data-flag={flag}
            style={e.mal_score != null ? { background: epColor(e.mal_score) } : undefined}
            aria-label={`Episode ${e.episode_number}${e.title ? `, ${e.title}` : ""}, ${e.mal_score != null ? `scored ${e.mal_score.toFixed(2)}` : "no score"}`}
            onPointerEnter={(ev) => onEnter(ev, e)}
            onFocus={(ev) => open(ev.currentTarget, e)}
            onBlur={() => setTip(null)}
            onClick={(ev) => open(ev.currentTarget, e)}
          >
            <span className="ecell-no num" data-len={String(e.episode_number).length}>{e.episode_number}</span>
            {showScore && e.mal_score != null ? <span className="ecell-score num">{e.mal_score.toFixed(1)}</span> : null}
          </button>
        );
      })}

      {tip ? (
        <div className={`etip${tip.above ? " is-above" : ""}`} style={{ left: tip.x, top: tip.top }} role="status">
          <p className="etip-head num">
            <strong>Episode {tip.ep.episode_number}</strong>
            {tip.ep.mal_score != null ? (
              <span className="etip-score" style={{ background: epColor(tip.ep.mal_score) }}>
                {tip.ep.mal_score.toFixed(2)}
              </span>
            ) : (
              <span className="etip-none">no score</span>
            )}
          </p>
          <p className="etip-title">{tip.ep.title ?? "Untitled"}</p>
          {tip.ep.title_japanese ? <p className="etip-jp jp">{tip.ep.title_japanese}</p> : null}
          <p className="etip-meta num">
            {date(tip.ep.aired)}
            {tip.ep.filler ? ", filler" : ""}
            {tip.ep.recap ? ", recap" : ""}
          </p>
          {clean(tip.ep.synopsis) ? <p className="etip-syn">{clip(clean(tip.ep.synopsis), 240)}</p> : <p className="etip-syn etip-empty">No synopsis stored.</p>}
        </div>
      ) : null}
    </div>
    </div>
  );
}

/* ---------------- plain list ---------------- */

function EpisodeList({ rows, best, worst }: { rows: EpisodePoint[]; best: Props["best"]; worst: Props["worst"] }) {
  const [openEp, setOpenEp] = useState<number | null>(null);
  return (
    <ol className="ep-list">
      {rows.map((e) => {
        const isBest = best?.episode_numbers.includes(e.episode_number);
        const isWorst = worst?.episode_numbers.includes(e.episode_number);
        const open = openEp === e.episode_number;
        return (
          <li key={e.episode_number} className="ep-row">
            <button type="button" className="ep-row-btn" aria-expanded={open} onClick={() => setOpenEp(open ? null : e.episode_number)}>
              <span className="ep-no num">{e.episode_number}</span>
              <span className="ep-name">
                <span className="ep-name-main">{e.title ?? "Untitled"}</span>
                <span className="ep-name-sub num">
                  {date(e.aired)}
                  {e.filler ? <span className="badge badge-filler">Filler</span> : null}
                  {e.recap ? <span className="badge badge-recap">Recap</span> : null}
                  {isBest ? <span className="badge badge-best">Highest</span> : null}
                  {isWorst ? <span className={`badge ${worst && worst.mal_score >= 8 ? "badge-low" : "badge-worst"}`}>Lowest</span> : null}
                </span>
              </span>
              <span className="ep-score">
                {e.mal_score != null ? (
                  <>
                    <span className="ep-bar" aria-hidden="true">
                      <span style={{ width: `${Math.max(4, Math.min(100, ((e.mal_score - 5) / 5) * 100))}%`, background: epColor(e.mal_score) }} />
                    </span>
                    <b className="num">{e.mal_score.toFixed(2)}</b>
                  </>
                ) : (
                  <span className="ep-noscore">No score</span>
                )}
              </span>
            </button>
            {open ? (
              <div className="ep-detail">
                {e.title_japanese ? <p className="jp ep-jp">{e.title_japanese}</p> : null}
                <p>{clean(e.synopsis) || "No synopsis stored for this episode."}</p>
              </div>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
