"use client";

import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
import type { Filters, FilterMeta, StudioPick } from "./filters";

type Props = {
  filters: Filters;
  meta: FilterMeta | null;
  patch: (p: Partial<Filters>) => void;
  onReset: () => void;
  canReset: boolean;
};

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

const RATING_STEPS = [
  { value: 0, label: "Any" },
  { value: 1000, label: "1,000+" },
  { value: 10000, label: "10,000+" },
  { value: 100000, label: "100,000+" },
];

export function FilterPanel({ filters, meta, patch, onReset, canReset }: Props) {
  const [tagQuery, setTagQuery] = useState("");
  const tags = useMemo(() => {
    const q = tagQuery.trim().toLowerCase();
    return (meta?.tags ?? []).filter((t) => !q || t.name.toLowerCase().includes(q));
  }, [meta, tagQuery]);

  return (
    <div className="filter-panel">
      <div className="filter-head">
        <h2>Filters</h2>
        <button type="button" className="link-btn" onClick={onReset} disabled={!canReset}>
          Reset
        </button>
      </div>

      <Group title="Type">
        <Chips options={meta?.types} selected={filters.type} onToggle={(v) => patch({ type: toggle(filters.type, v) })} />
      </Group>

      <Group title="Status">
        <Chips options={meta?.statuses} selected={filters.status} onToggle={(v) => patch({ status: toggle(filters.status, v) })} />
      </Group>

      <Group title="Season">
        <Chips options={meta?.seasons} selected={filters.season} onToggle={(v) => patch({ season: toggle(filters.season, v) })} />
      </Group>

      <Group title="Years">
        <div className="years">
          <label>
            <span>From</span>
            <input
              type="number"
              inputMode="numeric"
              min={meta?.years.min ?? 1917}
              max={meta?.years.max ?? 2028}
              placeholder={String(meta?.years.min ?? 1917)}
              value={filters.yearFrom}
              onChange={(e) => patch({ yearFrom: e.target.value })}
            />
          </label>
          <label>
            <span>To</span>
            <input
              type="number"
              inputMode="numeric"
              min={meta?.years.min ?? 1917}
              max={meta?.years.max ?? 2028}
              placeholder={String(meta?.years.max ?? 2028)}
              value={filters.yearTo}
              onChange={(e) => patch({ yearTo: e.target.value })}
            />
          </label>
        </div>
      </Group>

      <Group title="Minimum score">
        <div className="score-range">
          <input
            type="range"
            min={0}
            max={9.5}
            step={0.5}
            value={filters.minScore}
            onChange={(e) => patch({ minScore: Number(e.target.value) })}
            aria-label="Minimum MAL score"
            style={{ ["--p" as string]: `${(filters.minScore / 9.5) * 100}%` }}
          />
          <output className="num">{filters.minScore > 0 ? filters.minScore.toFixed(1) : "Any"}</output>
        </div>
      </Group>

      <Group title="Rated by at least">
        <div className="chips">
          {RATING_STEPS.map((r) => (
            <button key={r.value} type="button" className="chip" aria-pressed={filters.minRatings === r.value} onClick={() => patch({ minRatings: r.value })}>
              {r.label}
            </button>
          ))}
        </div>
      </Group>

      <Group title="Genres and themes">
        <input type="search" className="mini-input" placeholder="Find a genre" aria-label="Find a genre" value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} />
        <div className="chips scroll">
          {tags.map((t) => (
            <button key={t.tag_id} type="button" className="chip" aria-pressed={filters.tags.includes(t.tag_id)} onClick={() => patch({ tags: toggle(filters.tags, t.tag_id) })}>
              {t.name}
            </button>
          ))}
          {meta && tags.length === 0 ? <p className="hint">No genre called that.</p> : null}
        </div>
        {filters.tags.length > 1 ? (
          <div className="seg seg-sm" role="group" aria-label="Match genres">
            {(["all", "any"] as const).map((m) => (
              <button key={m} type="button" className="seg-btn" aria-pressed={filters.tagMatch === m} onClick={() => patch({ tagMatch: m })}>
                Match {m}
              </button>
            ))}
          </div>
        ) : null}
      </Group>

      <Group title="Studio">
        <StudioPicker picked={filters.studios} onChange={(studios) => patch({ studios })} />
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="group">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function Chips({ options, selected, onToggle }: { options?: { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void }) {
  if (!options) return <div className="chips skeleton-chips" aria-hidden="true" />;
  return (
    <div className="chips">
      {options.map((o) => (
        <button key={o.value} type="button" className="chip" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function StudioPicker({ picked, onChange }: { picked: StudioPick[]; onChange: (s: StudioPick[]) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<StudioPick[]>([]);

  const term = q.trim();
  const searching = term.length >= 2;

  useEffect(() => {
    if (!searching) return;
    const ctl = new AbortController();
    const t = window.setTimeout(() => {
      fetch(`${API_BASE}/studios?q=${encodeURIComponent(term)}&limit=6`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: { items: { studio_id: number; name: string }[] }) => setResults(d.items.map((s) => ({ id: s.studio_id, name: s.name }))))
        .catch(() => {});
    }, 220);
    return () => {
      window.clearTimeout(t);
      ctl.abort();
    };
  }, [term, searching]);

  const add = (s: StudioPick) => {
    if (!picked.some((p) => p.id === s.id) && picked.length < 10) onChange([...picked, s]);
    setQ("");
    setResults([]);
  };

  return (
    <div className="studio">
      {picked.length ? (
        <div className="chips">
          {picked.map((s) => (
            <button key={s.id} type="button" className="chip chip-on" aria-label={`Remove ${s.name}`} onClick={() => onChange(picked.filter((p) => p.id !== s.id))}>
              {s.name}
              <span aria-hidden="true"> x</span>
            </button>
          ))}
        </div>
      ) : null}
      <input type="search" className="mini-input" placeholder="Search studios" aria-label="Search studios" value={q} onChange={(e) => setQ(e.target.value)} />
      {searching && results.length ? (
        <ul className="suggest">
          {results.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => add(s)}>
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
