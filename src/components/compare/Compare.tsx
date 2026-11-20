"use client";

import { useEffect, useId, useMemo, useRef, useState, type PointerEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { API_BASE, compact, displayTitle, integer, type AnimeList, type AnimeStatistics, type AnimeSummary, type EpisodeAnalysis } from "@/lib/api";
import { DataNote } from "../DataNote";

/* ---------------- loading one anime's numbers ---------------- */

type Bundle = { stats: AnimeStatistics | null; eps: EpisodeAnalysis | null };
type Slot = { id: number; bundle: Bundle | null };

async function getJson<T>(path: string, signal: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { signal });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Both numbers and episodes for one anime. `loading` is derived from the id, so no state is set in the effect body. */
function useAnime(id: number | null) {
  const [slot, setSlot] = useState<Slot | null>(null);
  useEffect(() => {
    if (id == null) return;
    const ctl = new AbortController();
    Promise.all([getJson<AnimeStatistics>(`/anime/${id}/statistics`, ctl.signal), getJson<EpisodeAnalysis>(`/anime/${id}/statistics/episodes`, ctl.signal)]).then(([stats, eps]) => {
      if (!ctl.signal.aborted) setSlot({ id, bundle: { stats, eps } });
    });
    return () => ctl.abort();
  }, [id]);
  const ready = id != null && slot?.id === id;
  return { loading: id != null && !ready, bundle: ready ? slot.bundle : null };
}

/* ---------------- picker ---------------- */

type Found = { key: string; items: AnimeSummary[] };

function Picker({ side, label, chosen, onPick, onClear, blocked, autoFocus }: { side: "a" | "b"; label: string; chosen: AnimeSummary | AnimeStatistics["core"] | null; onPick: (a: AnimeSummary) => void; onClear: () => void; blocked: number | null; autoFocus: boolean }) {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [found, setFound] = useState<Found | null>(null);
  const [focus, setFocus] = useState(false);
  const [cursor, setCursor] = useState(0);
  const list = useId();

  useEffect(() => {
    const t = window.setTimeout(() => setTerm(q.trim()), 250);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (term.length < 2) return;
    const ctl = new AbortController();
    getJson<AnimeList>(`/anime?q=${encodeURIComponent(term)}&limit=6`, ctl.signal).then((r) => {
      if (!ctl.signal.aborted) setFound({ key: term, items: r?.items ?? [] });
    });
    return () => ctl.abort();
  }, [term]);

  const searching = q.trim().length >= 2;
  const loading = searching && found?.key !== term;
  const items = (searching && found?.key === term ? found.items : []).filter((a) => a.mal_id !== blocked);
  const open = focus && searching;

  const pick = (a: AnimeSummary) => {
    onPick(a);
    setQ("");
    setTerm("");
    setFocus(false);
  };

  if (chosen) {
    return (
      <div className={`cmp-slot cmp-${side} is-chosen`}>
        <span className="cmp-poster">{chosen.image_url ? <Image src={chosen.image_url} alt="" fill sizes="96px" style={{ objectFit: "cover" }} /> : null}</span>
        <div className="cmp-chosen-body">
          <p className="cmp-side num">{label}</p>
          <Link href={`/anime/${chosen.mal_id}`} className="cmp-name">
            {displayTitle(chosen)}
          </Link>
          <p className="cmp-sub num">{[chosen.type, chosen.year].filter(Boolean).join(", ")}</p>
        </div>
        <button type="button" className="btn-quiet cmp-change" onClick={onClear}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className={`cmp-slot cmp-${side}`}>
      <label className="cmp-side num" htmlFor={`${list}-in`}>
        {label}
      </label>
      <input
        id={`${list}-in`}
        className="cmp-input"
        autoFocus={autoFocus}
        type="search"
        placeholder="Search for an anime"
        autoComplete="off"
        value={q}
        role="combobox"
        aria-expanded={open}
        aria-controls={list}
        aria-autocomplete="list"
        aria-activedescendant={open && items[cursor] ? `${list}-o${items[cursor].mal_id}` : undefined}
        onChange={(e) => {
          setQ(e.target.value);
          setCursor(0);
          setFocus(true);
        }}
        onFocus={() => setFocus(true)}
        onBlur={() => window.setTimeout(() => setFocus(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setCursor((c) => Math.min(items.length - 1, c + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setCursor((c) => Math.max(0, c - 1));
          } else if (e.key === "Enter" && items[cursor]) {
            e.preventDefault();
            pick(items[cursor]);
          } else if (e.key === "Escape") setFocus(false);
        }}
      />
      {open ? (
        <ul id={list} className="cmp-results" role="listbox">
          {loading ? <li className="cmp-hint">Searching...</li> : null}
          {!loading && items.length === 0 ? <li className="cmp-hint">Nothing found for that. Try another spelling.</li> : null}
          {!loading
            ? items.map((a, i) => (
                <li key={a.mal_id} id={`${list}-o${a.mal_id}`} role="option" aria-selected={i === cursor}>
                  <button type="button" className={i === cursor ? "is-cursor" : undefined} onMouseDown={(e) => e.preventDefault()} onClick={() => pick(a)}>
                    <span className="cmp-thumb">{a.image_url ? <Image src={a.image_url} alt="" fill sizes="40px" style={{ objectFit: "cover" }} /> : null}</span>
                    <span>
                      <strong>{displayTitle(a)}</strong>
                      <small className="num">{[a.type, a.year, a.mal_score ? `${a.mal_score.toFixed(2)} score` : null].filter(Boolean).join(", ")}</small>
                    </span>
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  );
}

/* ---------------- the numbers ---------------- */

type Side = { core: AnimeStatistics["core"]; stats: AnimeStatistics["statistics"]; eps: EpisodeAnalysis | null };

const mean = (xs: number[]) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);

type Metric = {
  key: string;
  label: string;
  hint: string;
  /** "high" or "low" says which side wins; null is shown but never scored. */
  better: "high" | "low" | null;
  get: (s: Side) => number | null;
  show: (v: number) => string;
  /** bar length as a 0..1 share of the larger value */
  scale?: "share";
};

const METRICS: Metric[] = [
  { key: "score", label: "MAL score", hint: "Average score from everyone who rated it", better: "high", get: (s) => s.core.mal_score, show: (v) => v.toFixed(2) },
  { key: "rank", label: "Overall rank", hint: "Position by score among all anime. Lower is better", better: "low", get: (s) => s.core.rank_mal, show: (v) => `#${integer(v)}` },
  { key: "members", label: "Members", hint: "People who put it on their list", better: null, get: (s) => s.core.members_mal, show: (v) => compact(v) },
  { key: "fav", label: "Favorites per member", hint: "How many members favorited it, scaled by size", better: "high", get: (s) => s.stats?.engagement.favorites_per_member ?? null, show: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "done", label: "Finished it", hint: "Share of people who started it and completed it", better: "high", get: (s) => s.stats?.list_status.completion_rate ?? null, show: (v) => `${(v * 100).toFixed(1)}%` },
  { key: "drop", label: "Dropped it", hint: "Share of people who started it and quit", better: "low", get: (s) => s.stats?.list_status.drop_rate ?? null, show: (v) => `${(v * 100).toFixed(1)}%` },
  {
    key: "ep",
    label: "Average episode score",
    hint: "Mean of every scored episode",
    better: "high",
    get: (s) => mean((s.eps?.episodes ?? []).map((e) => e.mal_score).filter((v): v is number => v != null)),
    show: (v) => v.toFixed(2),
  },
  { key: "split", label: "How split the votes are", hint: "Spread of scores. A high number means people disagree", better: null, get: (s) => s.stats?.polarization.standard_deviation ?? null, show: (v) => v.toFixed(2) },
  { key: "len", label: "Episodes", hint: "Length of the series", better: null, get: (s) => s.core.episodes ?? (s.eps?.episodes.length || null), show: (v) => integer(v) },
];

function winner(m: Metric, a: number | null, b: number | null): "a" | "b" | "tie" | null {
  if (!m.better || a == null || b == null) return null;
  if (Math.abs(a - b) < 1e-9) return "tie";
  return (m.better === "high" ? a > b : a < b) ? "a" : "b";
}

function Rows({ a, b }: { a: Side; b: Side }) {
  const nameA = displayTitle(a.core);
  const nameB = displayTitle(b.core);
  const rows = METRICS.map((m) => {
    const va = m.get(a);
    const vb = m.get(b);
    return { m, va, vb, w: winner(m, va, vb) };
  }).filter((r) => r.va != null || r.vb != null);
  const scored = rows.filter((r) => r.w);
  const winsA = scored.filter((r) => r.w === "a").length;
  const winsB = scored.filter((r) => r.w === "b").length;

  return (
    <section className="cmp-section" aria-labelledby="cmp-rows">
      <h2 id="cmp-rows">Head to head</h2>
      <p className="section-lead">
        {winsA === winsB ? (
          `Level on the measures that have a clear winner: ${winsA} each.`
        ) : (
          <>
            <strong className={winsA > winsB ? "cmp-a" : "cmp-b"} style={{ color: "var(--c)" }}>
              {winsA > winsB ? nameA : nameB}
            </strong>{" "}
            leads on {Math.max(winsA, winsB)} of {scored.length} measures that have a clear winner.
          </>
        )}{" "}
        The brighter bar wins; faded bars lost. Where lower is better, the shorter bar wins.
      </p>
      <div className="cmp-tally" role="img" aria-label={`${nameA} wins ${winsA}, ${nameB} wins ${winsB}`}>
        <span className="cmp-a num">{winsA}</span>
        <i>
          <b className="cmp-a" style={{ flexGrow: winsA || 0.05 }} />
          <b className="cmp-b" style={{ flexGrow: winsB || 0.05 }} />
        </i>
        <span className="cmp-b num">{winsB}</span>
      </div>
      <p className="cmp-key cmp-key-tight">
        <span className="cmp-a">{nameA}</span>
        <span className="cmp-b">{nameB}</span>
      </p>
      <ul className="cmp-rows">
        {rows.map(({ m, va, vb, w }, i) => {
          const max = Math.max(va ?? 0, vb ?? 0, 0.0001);
          return (
            <li key={m.key} style={{ ["--i" as string]: i }}>
              <div className="cmp-row-head">
                <strong>{m.label}</strong>
                {m.better === "low" ? <em className="cmp-low">lower wins</em> : null}
                <span>{m.hint}</span>
              </div>
              <div className="cmp-pair">
                {([["a", va], ["b", vb]] as const).map(([side, v]) => (
                  <div key={side} className={`cmp-cell cmp-${side}${w === side ? " is-win" : w && w !== "tie" ? " is-lose" : ""}`}>
                    <b className="num">
                      {w === side ? <span className="cmp-check" aria-label="better">&#10003;</span> : null}
                      {v != null ? m.show(v) : "no data"}
                    </b>
                    <span className="cmp-bar" aria-hidden="true">
                      <i style={{ width: v != null ? `${Math.max(2, (v / max) * 100)}%` : "0%" }} />
                    </span>
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ---------------- score distribution ---------------- */

function Distribution({ a, b }: { a: Side; b: Side }) {
  const da = a.stats?.score_distribution.buckets;
  const db = b.stats?.score_distribution.buckets;
  if (!da?.length || !db?.length) return null;
  const scores = Array.from({ length: 10 }, (_, i) => i + 1);
  const get = (bs: typeof da, s: number) => bs.find((x) => x.score === s)?.percentage ?? 0;
  const max = Math.max(...scores.map((s) => Math.max(get(da, s), get(db, s))), 0);
  if (max <= 0) return null;
  return (
    <section className="cmp-section" aria-labelledby="cmp-dist">
      <h2 id="cmp-dist">How people scored them</h2>
      <p className="section-lead">Share of votes at each score. Two bars at the same height mean the same opinion.</p>
      <div className="panel cmp-dist">
        {scores.map((s) => (
          <div key={s} className="cmp-dist-col">
            <div className="cmp-dist-bars">
              <i className="cmp-a" style={{ height: `${(get(da, s) / max) * 100}%` }} title={`${displayTitle(a.core)}: ${(get(da, s) * 100).toFixed(1)}% gave a ${s}`} />
              <i className="cmp-b" style={{ height: `${(get(db, s) / max) * 100}%` }} title={`${displayTitle(b.core)}: ${(get(db, s) * 100).toFixed(1)}% gave a ${s}`} />
            </div>
            <span className="num">{s}</span>
          </div>
        ))}
      </div>
      <p className="cmp-key">
        <span className="cmp-a">{displayTitle(a.core)}</span>
        <span className="cmp-b">{displayTitle(b.core)}</span>
      </p>
    </section>
  );
}

/* ---------------- episodes, side by side ---------------- */

type Pt = { t: number; ep: number; v: number };

function series(eps: EpisodeAnalysis | null): Pt[] {
  const all = (eps?.episodes ?? []).filter((e) => e.mal_score != null);
  const n = all.length;
  return all.map((e, i) => ({ t: n > 1 ? i / (n - 1) : 0, ep: e.episode_number, v: (e.smoothed_score ?? e.mal_score) as number }));
}

function EpisodeOverlay({ a, b }: { a: Side; b: Side }) {
  const sa = useMemo(() => series(a.eps), [a.eps]);
  const sb = useMemo(() => series(b.eps), [b.eps]);
  const [hover, setHover] = useState<number | null>(null);
  const enough = sa.length > 2 && sb.length > 2;
  const [W, setW] = useState(900);
  const box = useRef<SVGSVGElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  // draw at the real width so text keeps its size on a phone instead of shrinking with the chart
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [enough]);
  if (sa.length < 3 || sb.length < 3) return null;

  const all = [...sa, ...sb].map((p) => p.v);
  const lo = Math.floor((Math.min(...all) - 0.1) * 5) / 5;
  const hi = Math.ceil((Math.max(...all) + 0.1) * 5) / 5;
  const H = W < 520 ? 260 : 300;
  const pad = { t: 16, r: 12, b: 34, l: 38 };
  const x = (t: number) => pad.l + t * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (H - pad.t - pad.b);
  const path = (s: Pt[]) => s.map((p, i) => `${i ? "L" : "M"}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  const near = (s: Pt[], t: number) => s.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best), s[0]);
  const t = hover;
  const pa = t != null ? near(sa, t) : null;
  const pb = t != null ? near(sb, t) : null;

  const move = (e: PointerEvent<SVGSVGElement>) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    setHover(Math.max(0, Math.min(1, (px - pad.l) / (W - pad.l - pad.r))));
  };

  return (
    <section className="cmp-section" aria-labelledby="cmp-eps">
      <h2 id="cmp-eps">Do they stay good?</h2>
      <p className="section-lead">Episode scores, smoothed, laid on the same line from first episode to last so a 12-episode show and a 1,000-episode one can be compared.</p>
      <div className="panel cmp-chart">
        <div className="cmp-readout num" aria-live="polite">
          {pa && pb ? (
            <>
              <span className="cmp-a">
                {displayTitle(a.core)}: ep {pa.ep}, {pa.v.toFixed(2)}
              </span>
              <span className="cmp-b">
                {displayTitle(b.core)}: ep {pb.ep}, {pb.v.toFixed(2)}
              </span>
            </>
          ) : (
            <span>Move across the chart to read both at the same point.</span>
          )}
        </div>
        <div ref={wrap}>
        <svg ref={box} width={W} height={H} className="cmp-svg" role="img" aria-label="Smoothed episode scores of both anime plotted from first to last episode" onPointerMove={move} onPointerLeave={() => setHover(null)}>
          {ticks.map((v) => (
            <g key={v}>
              <line className="grid" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
              <text x={pad.l - 8} y={y(v) + 4} textAnchor="end" className="num">
                {v.toFixed(1)}
              </text>
            </g>
          ))}
          <text x={pad.l} y={H - 8} className="num">
            First episode
          </text>
          <text x={W - pad.r} y={H - 8} textAnchor="end" className="num">
            Last episode
          </text>
          <path className="cmp-line cmp-a" d={path(sa)} />
          <path className="cmp-line cmp-b" d={path(sb)} />
          {pa && pb && t != null ? (
            <>
              <line className="cursor" x1={x(t)} x2={x(t)} y1={pad.t} y2={H - pad.b} />
              <circle className="cmp-dot cmp-a" cx={x(pa.t)} cy={y(pa.v)} r="6" />
              <circle className="cmp-dot cmp-b" cx={x(pb.t)} cy={y(pb.v)} r="6" />
            </>
          ) : null}
        </svg>
        </div>
        <p className="cmp-key">
          <span className="cmp-a">{displayTitle(a.core)}</span>
          <span className="cmp-b">{displayTitle(b.core)}</span>
        </p>
      </div>
    </section>
  );
}

/* ---------------- the page ---------------- */

const toId = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export function Compare({ picks }: { picks: AnimeSummary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const idA = toId(params.get("a"));
  const rawB = toId(params.get("b"));
  const idB = rawB === idA ? null : rawB; // the same anime twice says nothing
  const A = useAnime(idA);
  const B = useAnime(idB);
  const [chosen, setChosen] = useState<Record<number, AnimeSummary>>({});
  const [focusSide, setFocusSide] = useState<"a" | "b" | null>(null);

  const go = (a: number | null, b: number | null) => {
    const p = new URLSearchParams();
    if (a) p.set("a", String(a));
    if (b) p.set("b", String(b));
    router.push(p.size ? `${pathname}?${p}` : pathname, { scroll: false });
  };
  const remember = (s: AnimeSummary) => setChosen((c) => ({ ...c, [s.mal_id]: s }));

  const known = (id: number | null, bundle: Bundle | null) => (id == null ? null : (bundle?.stats?.core ?? chosen[id] ?? picks.find((p) => p.mal_id === id) ?? null));
  const coreA = known(idA, A.bundle);
  const coreB = known(idB, B.bundle);

  const side = (id: number | null, b: Bundle | null): Side | null => (id && b?.stats ? { core: b.stats.core, stats: b.stats.statistics, eps: b.eps } : null);
  const sa = side(idA, A.bundle);
  const sb = side(idB, B.bundle);
  const loading = A.loading || B.loading;
  const failed = (idA != null && !A.loading && !sa) || (idB != null && !B.loading && !sb);
  const nextEmpty = idA == null ? "a" : idB == null ? "b" : null;

  return (
    <div className="cmp">
      <div className="cmp-picks">
        <Picker side="a" label="First anime" chosen={coreA} blocked={idB} autoFocus={focusSide === "a"} onPick={(s) => { remember(s); go(s.mal_id, idB); }} onClear={() => { setFocusSide("a"); go(null, idB); }} />
        <button type="button" className="cmp-swap" aria-label="Swap the two anime" disabled={!idA && !idB} onClick={() => go(idB, idA)}>
          <span aria-hidden="true">vs</span>
        </button>
        <Picker side="b" label="Second anime" chosen={coreB} blocked={idA} autoFocus={focusSide === "b"} onPick={(s) => { remember(s); go(idA, s.mal_id); }} onClear={() => { setFocusSide("b"); go(idA, null); }} />
      </div>

      {nextEmpty && picks.length ? (
        <div className="cmp-suggest">
          <p>{idA || idB ? "Pick something to set it against:" : "Or start from a popular one (it fills the first empty slot):"}</p>
          <div className="chips">
            {picks
              .filter((p) => p.mal_id !== idA && p.mal_id !== idB)
              .slice(0, 8)
              .map((p) => (
                <button
                  key={p.mal_id}
                  type="button"
                  className="chip"
                  onClick={() => {
                    remember(p);
                    go(nextEmpty === "a" ? p.mal_id : idA, nextEmpty === "b" ? p.mal_id : idB);
                  }}
                >
                  {displayTitle(p)}
                </button>
              ))}
          </div>
        </div>
      ) : null}

      {idA && idB ? (
        failed ? (
          <DataNote title="One of those could not be loaded." seed={(idA ?? 0) + (idB ?? 0)}>
            The API did not answer for it. Change the pick or try again in a moment.
          </DataNote>
        ) : loading || !sa || !sb ? (
          <div className="cmp-loading" aria-busy="true">
            <p className="sr-only">Loading the comparison</p>
            <div className="skel skel-wide" />
            <div className="skel skel-wide" />
          </div>
        ) : (
          <div className="cmp-body">
            <Rows a={sa} b={sb} />
            <Distribution a={sa} b={sb} />
            <EpisodeOverlay a={sa} b={sb} />
            <p className="cmp-share">
              This page&apos;s link keeps both picks, so you can send it to someone.
            </p>
          </div>
        )
      ) : (
        <p className="cmp-empty">You will see their scores, drop rates, how people rated them and how their episodes hold up.</p>
      )}
    </div>
  );
}
