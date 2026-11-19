"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, aggQuery, compact, integer, type AggScope, type HiddenGemItem, type MostDroppedItem } from "@/lib/api";
import { DEFAULT_MIN_RATINGS, GENRE_MIN_ANIME, STUDIO_MIN_ANIME, genreRows, studioRows, yearPoints, type GroupRow, type YearPoint } from "@/lib/aggregate";
import { DataNote } from "./DataNote";
import { Reveal } from "./Reveal";
import { YearChart } from "./Aggregates";

/* ---------------- the aggregate boards, with live filters ---------------- */

export type { GroupRow };

type Boards = { years: YearPoint[]; genres: GroupRow[]; studios: GroupRow[]; types: GroupRow[]; seasons: GroupRow[] };
type Loaded<T> = { key: string; data: T | null };

const TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Special" },
];
const RATING_OPTIONS = [
  { value: 0, label: "Any" },
  { value: DEFAULT_MIN_RATINGS, label: "50" },
  { value: 500, label: "500" },
  { value: 5000, label: "5,000" },
  { value: 50000, label: "50,000" },
];

async function getJson(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** A type + minimum-ratings scope, and the API data that goes with it. Starts on the server-rendered default. */
function useScoped<T>(initial: T, load: (o: AggScope) => Promise<T>) {
  const [type, setType] = useState("");
  const [minRatings, setMinRatings] = useState(DEFAULT_MIN_RATINGS);
  const [loaded, setLoaded] = useState<Loaded<T> | null>(null);
  const key = `${type}|${minRatings}`;
  const isDefault = type === "" && minRatings === DEFAULT_MIN_RATINGS;

  useEffect(() => {
    if (isDefault) return;
    let live = true;
    load({ type: type || undefined, minRatings })
      .then((data) => live && setLoaded({ key, data }))
      .catch(() => live && setLoaded({ key, data: null }));
    return () => {
      live = false;
    };
    // `load` is a module-level function, so it is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, minRatings, key, isDefault]);

  const settled = !isDefault && loaded?.key === key;
  return {
    type,
    setType,
    minRatings,
    setMinRatings,
    loading: !isDefault && !settled,
    failed: settled && loaded?.data === null,
    data: isDefault ? initial : settled && loaded?.data ? loaded.data : initial,
  };
}

function ScopeBar({ id, scope, note }: { id: string; scope: { type: string; setType: (v: string) => void; minRatings: number; setMinRatings: (v: number) => void; loading: boolean }; note: string }) {
  return (
    <div className="scope-bar" role="group" aria-label={`Filter: ${note}`}>
      <div className="scope-field">
        <span className="scope-label" id={`${id}-type`}>
          Type
        </span>
        <div className="chips" role="group" aria-labelledby={`${id}-type`}>
          {TYPE_OPTIONS.map((t) => (
            <button key={t.value} type="button" className="chip" aria-pressed={scope.type === t.value} onClick={() => scope.setType(t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="scope-field">
        <span className="scope-label" id={`${id}-ratings`}>
          Ratings an anime needs to count
        </span>
        <div className="chips" role="group" aria-labelledby={`${id}-ratings`}>
          {RATING_OPTIONS.map((r) => (
            <button key={r.value} type="button" className="chip" aria-pressed={scope.minRatings === r.value} onClick={() => scope.setMinRatings(r.value)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <p className="scope-note" aria-live="polite">
        {scope.loading ? "Loading the numbers..." : note}
      </p>
    </div>
  );
}

const loadYears = async (o: AggScope) => yearPoints((await getJson(`/statistics/by-year${aggQuery(o)}`)).items);
const loadGroups = async (o: AggScope) => {
  const [g, st] = await Promise.all([getJson(`/statistics/by-tag${aggQuery(o)}`), getJson(`/statistics/by-studio${aggQuery(o, "limit=100")}`)]);
  return { genres: genreRows(g.items), studios: studioRows(st.items) };
};

/**
 * The aggregate boards. The year chart and the genre and studio boards each have their own filter, placed right
 * under their heading. They map onto the API's `type` and `min_ratings` options, so the numbers are the API's.
 */
export function AggregateBoards({ initial }: { initial: Boards }) {
  const years = useScoped(initial.years, loadYears);
  const groups = useScoped({ genres: initial.genres, studios: initial.studios }, loadGroups);

  return (
    <>
      <section className="anime-section" aria-labelledby="year-title">
        <Reveal>
          <h2 id="year-title">Scores over the years</h2>
          <p className="section-lead">Average MAL score of the anime that started each year. Narrow it by type or by how many ratings an anime needs.</p>
        </Reveal>
        <ScopeBar id="yr" scope={years} note="A higher minimum leaves out anime with few votes." />
        {years.failed ? (
          <DataNote title="That chart could not be loaded." seed={11}>
            The API did not respond for this filter, so the chart shows the default view.
          </DataNote>
        ) : null}
        <div className="scope-body" data-stale={years.loading}>
          {years.data.length >= 2 ? (
            <Reveal plain className="panel" delay={40}>
              <YearChart points={years.data} />
            </Reveal>
          ) : (
            <p className="unavailable">Not enough anime match this filter to draw the yearly chart.</p>
          )}
        </div>
      </section>

      <section className="anime-section" aria-labelledby="genre-title">
        <Reveal>
          <h2 id="genre-title">Genres and studios</h2>
          <p className="section-lead">
            Genres with at least {GENRE_MIN_ANIME} scored anime and studios with at least {STUDIO_MIN_ANIME}. Every name links to its anime in the explorer.
          </p>
        </Reveal>
        <ScopeBar id="gr" scope={groups} note="This filter applies to the genre and studio boards below." />
        {groups.failed ? (
          <DataNote title="Those boards could not be loaded." seed={12}>
            The API did not respond for this filter, so the boards show the default view.
          </DataNote>
        ) : null}
        <div className="scope-body" data-stale={groups.loading}>
          <h3 className="board-heading">Genres</h3>
          {groups.data.genres.length ? (
            <Reveal plain className="panel" delay={40}>
              <GroupBoard rows={groups.data.genres} unit="anime" />
            </Reveal>
          ) : (
            <p className="unavailable">No genre has {GENRE_MIN_ANIME} scored anime at this setting. Lower the ratings minimum or pick all types.</p>
          )}
          <h3 className="board-heading">Studios</h3>
          {groups.data.studios.length ? (
            <Reveal plain className="panel" delay={40}>
              <GroupBoard rows={groups.data.studios} unit="anime" />
            </Reveal>
          ) : (
            <p className="unavailable">No studio has {STUDIO_MIN_ANIME} scored anime at this setting. Lower the ratings minimum or pick all types.</p>
          )}
        </div>
      </section>

      <div className="stats-duo">
        <section className="anime-section" aria-labelledby="type-title">
          <Reveal>
            <h2 id="type-title">By type</h2>
          </Reveal>
          {initial.types.length ? (
            <Reveal plain className="panel" delay={40}>
              <GroupBoard rows={initial.types} unit="anime" limit={6} />
            </Reveal>
          ) : (
            <p className="unavailable">No type data.</p>
          )}
        </section>
        <section className="anime-section" aria-labelledby="season-title">
          <Reveal>
            <h2 id="season-title">By season</h2>
          </Reveal>
          {initial.seasons.length ? (
            <Reveal plain className="panel" delay={40}>
              <GroupBoard rows={initial.seasons} unit="anime" limit={4} />
            </Reveal>
          ) : (
            <p className="unavailable">No season data.</p>
          )}
        </section>
      </div>
    </>
  );
}

/* ---------------- group leaderboards: genres, studios, types, seasons ---------------- */

export function GroupBoard({ rows, unit, limit = 12, linkLabel }: { rows: GroupRow[]; unit: string; limit?: number; linkLabel?: string }) {
  const [sort, setSort] = useState<"score" | "count">("score");
  const [all, setAll] = useState(false);
  const sorted = [...rows].sort((a, b) => (sort === "score" ? b.mean - a.mean : b.count - a.count));
  const shown = all ? sorted : sorted.slice(0, limit);
  const lo = 5.5;
  const hiMean = Math.max(...rows.map((r) => r.mean));
  const hiCount = Math.max(...rows.map((r) => r.count));

  return (
    <div className="board">
      <div className="board-controls">
        <div className="seg seg-sm" role="group" aria-label="Sort by">
          <button type="button" className="seg-btn" aria-pressed={sort === "score"} onClick={() => setSort("score")}>
            Highest rated
          </button>
          <button type="button" className="seg-btn" aria-pressed={sort === "count"} onClick={() => setSort("count")}>
            Most {unit}
          </button>
        </div>
      </div>
      <ol className="board-list board-wide" key={sort}>
        {shown.map((r, i) => (
          <li key={r.key} style={{ ["--i" as string]: Math.min(i, 14) }}>
            {r.href ? (
              <Link href={r.href} className="board-name board-link" aria-label={`${r.name}: ${linkLabel ?? "see them in the explorer"}`}>
                {r.name}
              </Link>
            ) : (
              <span className="board-name">{r.name}</span>
            )}
            <span className="board-track" aria-hidden="true">
              <span className="board-fill" style={{ width: `${sort === "score" ? ((r.mean - lo) / (hiMean - lo || 1)) * 100 : (r.count / hiCount) * 100}%` }} />
            </span>
            <span className="board-val num">{sort === "score" ? r.mean.toFixed(2) : integer(r.count)}</span>
            <span className="board-sub num">
              {sort === "score" ? `${integer(r.count)} ${unit}` : `${r.mean.toFixed(2)} average`}
            </span>
          </li>
        ))}
      </ol>
      {rows.length > limit ? (
        <button type="button" className="link-btn board-all" onClick={() => setAll((a) => !a)}>
          {all ? "Show fewer" : `Show all ${rows.length}`}
        </button>
      ) : null}
      {sort === "score" ? <p className="chart-note">Average MAL score. Bars start at 5.5, so they show the gap and not the total.</p> : null}
    </div>
  );
}

/* ---------------- hidden gems and most dropped ---------------- */

const TYPES = [
  { value: "", label: "All types" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "ona", label: "ONA" },
  { value: "special", label: "Special" },
  { value: "tv_special", label: "TV Special" },
];

type Kind = "hidden-gems" | "most-dropped";
type Row = HiddenGemItem | MostDroppedItem;

const FLOORS: Record<Kind, { param: string; label: string; options: { value: number; label: string }[]; initial: number }> = {
  "hidden-gems": {
    param: "min_ratings",
    label: "Ratings an anime needs",
    initial: 50,
    options: [
      { value: 50, label: "50" },
      { value: 500, label: "500" },
      { value: 5000, label: "5,000" },
      { value: 20000, label: "20,000" },
    ],
  },
  "most-dropped": {
    param: "min_members",
    label: "Members an anime needs",
    initial: 10000,
    options: [
      { value: 1000, label: "1,000" },
      { value: 10000, label: "10,000" },
      { value: 100000, label: "100,000" },
      { value: 500000, label: "500,000" },
    ],
  },
};

export function PlatformList({ kind, initial, total, blurb }: { kind: Kind; initial: Row[]; total: number; blurb: string }) {
  const floorDef = FLOORS[kind];
  const [floor, setFloor] = useState(floorDef.initial);
  const [type, setType] = useState("");
  const [items, setItems] = useState<Row[]>(initial);
  const [count, setCount] = useState(total);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const fetchPage = async (t: string, offset: number, f = floor) => {
    const qs = new URLSearchParams({ limit: "10", offset: String(offset), [floorDef.param]: String(f) });
    if (t) qs.set("type", t);
    const res = await fetch(`${API_BASE}/statistics/${kind}?${qs}`);
    if (!res.ok) throw new Error(String(res.status));
    return (await res.json()) as { items: Row[]; total: number };
  };

  const pick = async (t: string, f = floor) => {
    setType(t);
    setFloor(f);
    setLoading(true);
    setFailed(false);
    try {
      const d = await fetchPage(t, 0, f);
      setItems(d.items);
      setCount(d.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const more = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const d = await fetchPage(type, items.length);
      setItems((cur) => [...cur, ...d.items]);
      setCount(d.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  const isGems = kind === "hidden-gems";

  return (
    <div className="plist">
      <p className="section-lead">{blurb}</p>
      <div className="chips" role="group" aria-label="Filter by type">
        {TYPES.map((t) => (
          <button key={t.value} type="button" className="chip" aria-pressed={type === t.value} onClick={() => pick(t.value)} disabled={loading}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="scope-field" style={{ marginTop: 16 }}>
        <span className="scope-label" id={`floor-${kind}`}>
          {floorDef.label}
        </span>
        <div className="chips" role="group" aria-labelledby={`floor-${kind}`}>
          {floorDef.options.map((o) => (
            <button key={o.value} type="button" className="chip" aria-pressed={floor === o.value} onClick={() => pick(type, o.value)} disabled={loading}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <p className="results-count num" style={{ marginTop: 20 }}>
        {integer(count)} anime
      </p>
      {failed ? (
        <DataNote compact title="Could not load that list." seed={kind.length}>
          The API did not respond. Try again.
        </DataNote>
      ) : null}
      <ol className="plist-rows" data-stale={loading}>
        {items.map((r, i) => (
          <li key={r.mal_id} style={{ ["--i" as string]: Math.min(i % 10, 9) }}>
            <Link href={`/anime/${r.mal_id}`} className="plist-link">
              <span className="ranked-no num">{i + 1}</span>
              <span className="plist-main">
                <span className="plist-title">{r.title}</span>
                <span className="ranked-meta num">
                  {[r.type?.toUpperCase().replace("_", " "), r.year, r.members_mal ? `${compact(r.members_mal)} members` : null].filter(Boolean).join(", ")}
                </span>
                {isGems ? (
                  <span className="plist-note num">
                    Scored above {Math.round((r as HiddenGemItem).score_percentile * 100)}% of its type, with more members than only {Math.round((r as HiddenGemItem).members_percentile * 100)}%.
                  </span>
                ) : (
                  <span className="plist-note num">
                    {integer((r as MostDroppedItem).dropped)} of {integer((r as MostDroppedItem).started)} who started it dropped it.
                  </span>
                )}
              </span>
              <span className="ranked-score">
                <b className={`num${isGems ? "" : " bad"}`}>{isGems ? (r.mal_score?.toFixed(2) ?? "n/a") : `${Math.round((r as MostDroppedItem).drop_rate * 100)}%`}</b>
                <span>{isGems ? "MAL score" : "dropped"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {items.length === 0 && !loading && !failed ? <p className="unavailable">Nothing in this list for that type.</p> : null}
      {items.length < count ? (
        <div className="more">
          <button type="button" className="btn-quiet" onClick={more} disabled={loading}>
            {loading ? "Loading..." : "Show more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
