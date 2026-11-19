"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { API_BASE, compact, displayTitle, integer, type AnimeList, type AnimeSummary } from "@/lib/api";
import { Mascot } from "../Mascot";
import { DataNote } from "../DataNote";
import { EMPTY_FILTERS, filtersFromParams, filtersToParams, hasActiveFilters, listQuery, type Filters, type FilterMeta } from "./filters";
import { FilterPanel } from "./FilterPanel";

const PAGE = 24;
type Result = { key: string; items: AnimeSummary[]; total: number; from: number };

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setV(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function Explorer() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [filters, setFilters] = useState<Filters>(() => filtersFromParams(new URLSearchParams(params.toString())));
  const [meta, setMeta] = useState<FilterMeta | null>(null);
  const [res, setRes] = useState<Result | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [more, setMore] = useState(false);
  const [panel, setPanel] = useState(false);
  const [surprising, setSurprising] = useState(false);

  const applied = useDebounced(filters, 280);
  const key = `${listQuery(applied, PAGE, 0)}|${attempt}`;
  const items = res?.items ?? [];
  const total = res?.total ?? null;
  const loading = !res || res.key !== key;
  const status: "loading" | "ready" | "error" = failed === key ? "error" : loading ? "loading" : "ready";
  const active = hasActiveFilters(filters);
  const activeCount = useMemo(
    () =>
      filters.type.length +
      filters.status.length +
      filters.season.length +
      filters.tags.length +
      filters.studios.length +
      (filters.yearFrom ? 1 : 0) +
      (filters.yearTo ? 1 : 0) +
      (filters.minScore > 0 ? 1 : 0) +
      (filters.minRatings > 0 ? 1 : 0),
    [filters],
  );

  // filter options come from the API
  useEffect(() => {
    const ctl = new AbortController();
    fetch(`${API_BASE}/filters`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((m: FilterMeta) => setMeta(m))
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  const load = useCallback(
    async (f: Filters, offset: number, signal: AbortSignal) => {
      const res = await fetch(`${API_BASE}/anime?${listQuery(f, PAGE, offset)}`, { signal });
      if (!res.ok) throw new Error(String(res.status));
      return (await res.json()) as AnimeList;
    },
    [],
  );

  // a new filter set: start over, and mirror it in the URL
  useEffect(() => {
    const ctl = new AbortController();
    const qs = filtersToParams(applied).toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    load(applied, 0, ctl.signal)
      .then((d) => setRes({ key, items: d.items, total: d.total, from: 0 }))
      .catch(() => {
        if (!ctl.signal.aborted) setFailed(key);
      });
    return () => ctl.abort();
  }, [applied, key, load, pathname, router]);

  const loadMore = async () => {
    setMore(true);
    try {
      const d = await load(applied, items.length, new AbortController().signal);
      setRes((cur) => (cur && cur.key === key ? { ...cur, items: [...cur.items, ...d.items], total: d.total, from: cur.items.length } : cur));
    } catch {
      setFailed(key);
    } finally {
      setMore(false);
    }
  };

  const retry = () => {
    setFailed(null);
    setAttempt((n) => n + 1);
  };

  const surprise = async () => {
    setSurprising(true);
    try {
      const offset = Math.floor(Math.random() * 1200);
      const res = await fetch(`${API_BASE}/anime?sort=score&min_ratings=10000&limit=1&offset=${offset}`);
      const d = (await res.json()) as AnimeList;
      if (d.items[0]) router.push(`/anime/${d.items[0].mal_id}`);
    } catch {
      /* the button just does nothing if the API is unreachable */
    } finally {
      setSurprising(false);
    }
  };

  const patch = (p: Partial<Filters>) => setFilters((f) => ({ ...f, ...p }));
  const reset = () => setFilters({ ...EMPTY_FILTERS });

  const label = (opts: { value: string; label: string }[] | undefined, v: string) => opts?.find((o) => o.value === v)?.label ?? v;
  const pills: { key: string; label: string; clear: () => void }[] = [
    ...filters.type.map((v) => ({ key: `t${v}`, label: label(meta?.types, v), clear: () => patch({ type: filters.type.filter((x) => x !== v) }) })),
    ...filters.status.map((v) => ({ key: `s${v}`, label: label(meta?.statuses, v), clear: () => patch({ status: filters.status.filter((x) => x !== v) }) })),
    ...filters.season.map((v) => ({ key: `n${v}`, label: label(meta?.seasons, v), clear: () => patch({ season: filters.season.filter((x) => x !== v) }) })),
    ...filters.tags.map((id) => ({ key: `g${id}`, label: meta?.tags.find((t) => t.tag_id === id)?.name ?? `Genre ${id}`, clear: () => patch({ tags: filters.tags.filter((x) => x !== id) }) })),
    ...filters.studios.map((s) => ({ key: `u${s.id}`, label: s.name, clear: () => patch({ studios: filters.studios.filter((x) => x.id !== s.id) }) })),
    ...(filters.yearFrom || filters.yearTo ? [{ key: "y", label: `${filters.yearFrom || "..."} to ${filters.yearTo || "..."}`, clear: () => patch({ yearFrom: "", yearTo: "" }) }] : []),
    ...(filters.minScore > 0 ? [{ key: "m", label: `Score ${filters.minScore.toFixed(1)}+`, clear: () => patch({ minScore: 0 }) }] : []),
    ...(filters.minRatings > 0 ? [{ key: "r", label: `${integer(filters.minRatings)}+ ratings`, clear: () => patch({ minRatings: 0 }) }] : []),
  ];

  const sorts = (meta?.sorts ?? []).filter((s) => s.value !== "relevance" || filters.q.trim());
  const defaultSort = filters.q.trim() ? "relevance" : "members";
  const sortValue = filters.sort || defaultSort;
  const shown = items.length;

  return (
    <div className="explore">
      <section className="explore-hero wrap" aria-labelledby="explore-title">
        <div className="explore-title">
          <h1 id="explore-title">
            Find your <em className="accent">next anime</em>
          </h1>
          <p>
            Search {total != null && !active ? integer(total) : "every"} anime, then narrow it down by what you care about.
          </p>
        </div>
        <Mascot kind="luffy" className="explore-mascot" delay={150} />

        <div className="search">
          <svg className="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            type="search"
            className="search-input"
            placeholder="Search by title, like Frieren or Cowboy Bebop"
            aria-label="Search anime by title"
            value={filters.q}
            maxLength={100}
            onChange={(e) => patch({ q: e.target.value, sort: filters.sort === "relevance" && !e.target.value.trim() ? "" : filters.sort })}
          />
          <button type="button" className="surprise" onClick={surprise} disabled={surprising}>
            <svg className="surprise-die" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
              <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
              <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
            </svg>
            {surprising ? "Picking..." : "Surprise me"}
          </button>
        </div>
      </section>

      <div className="wrap explore-body">
        <button type="button" className="filters-toggle" aria-expanded={panel} aria-controls="filters" onClick={() => setPanel((p) => !p)}>
          Filters{activeCount ? ` (${activeCount})` : ""}
        </button>

        <aside id="filters" className="filters" data-open={panel}>
          <FilterPanel filters={filters} meta={meta} patch={patch} onReset={reset} canReset={active} />
        </aside>

        <section className="results" aria-live="polite" aria-busy={status === "loading"}>
          <div className="results-bar">
            <p className="results-count num">
              {status === "loading" && !items.length ? "Searching..." : total != null ? `${integer(total)} anime` : ""}
            </p>
            <div className="results-sort">
              <label htmlFor="sort">Sort by</label>
              <select id="sort" value={sortValue} onChange={(e) => patch({ sort: e.target.value })}>
                {(sorts.length ? sorts : [{ value: defaultSort, label: defaultSort }]).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="order-btn"
                aria-label={`Order: ${(filters.order || "desc") === "desc" ? "descending" : "ascending"}. Switch.`}
                onClick={() => patch({ order: (filters.order || "desc") === "desc" ? "asc" : "desc" })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: (filters.order || "desc") === "asc" ? "rotate(180deg)" : undefined }}>
                  <path d="M12 5v14M6 13l6 6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          {pills.length ? (
            <ul className="pills" aria-label="Active filters">
              {pills.map((p) => (
                <li key={p.key}>
                  <button type="button" className="pill" onClick={p.clear} aria-label={`Remove filter: ${p.label}`}>
                    {p.label}
                    <span aria-hidden="true"> x</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {status === "error" ? (
            <DataNote
              title="The API did not answer."
              seed={items.length + 3}
              action={
                <button type="button" className="btn-quiet" onClick={retry}>
                  Try again
                </button>
              }
            >
              Check your connection, or try again in a moment.
            </DataNote>
          ) : status === "loading" && !items.length ? (
            <ul className="grid" aria-hidden="true">
              {Array.from({ length: 12 }, (_, i) => (
                <li key={i} className="card skeleton" style={{ ["--i" as string]: i }}>
                  <span className="poster" />
                  <span className="skel-line" />
                  <span className="skel-line short" />
                </li>
              ))}
            </ul>
          ) : items.length === 0 ? (
            <div className="state">
              <Mascot kind="saitama" pop={false} />
              <h2>Nothing matches that.</h2>
              <p>Try fewer filters, or a shorter search.</p>
              <button type="button" className="btn-quiet" onClick={reset}>
                Clear everything
              </button>
            </div>
          ) : (
            <>
              <ul className="grid" data-stale={loading}>
                {items.map((a, i) => (
                  <li key={a.mal_id} className="card" style={{ ["--i" as string]: Math.min(Math.max(i - (res?.from ?? 0), 0), 14) }}>
                    <Link href={`/anime/${a.mal_id}`} className="card-btn" aria-label={`${displayTitle(a)}. Open its full statistics.`}>
                      <span className="poster">
                        {a.image_url ? <Image src={a.image_url} alt="" fill sizes="(max-width: 720px) 46vw, (max-width: 1200px) 24vw, 200px" style={{ objectFit: "cover" }} /> : null}
                        {a.mal_score ? <span className="score-tag num">{a.mal_score.toFixed(2)}</span> : null}
                      </span>
                      <span className="card-title">{displayTitle(a)}</span>
                      <span className="card-meta num">{[a.type, a.year, a.members_mal ? `${compact(a.members_mal)} members` : null].filter(Boolean).join(", ")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="more">
                <p className="num">
                  Showing {integer(shown)} of {total != null ? integer(total) : "..."}
                </p>
                {total != null && shown < total ? (
                  <button type="button" className="btn-quiet" onClick={loadMore} disabled={more}>
                    {more ? "Loading..." : "Show more"}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

    </div>
  );
}
