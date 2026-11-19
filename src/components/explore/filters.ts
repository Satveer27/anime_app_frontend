export type Opt = { value: string; label: string };
export type Tag = { tag_id: number; name: string; anime_count: number };

/** What GET /filters returns. */
export type FilterMeta = {
  types: Opt[];
  statuses: Opt[];
  seasons: Opt[];
  sorts: Opt[];
  years: { min: number; max: number };
  tags: Tag[];
};

export type StudioPick = { id: number; name: string };

export type Filters = {
  q: string;
  type: string[];
  status: string[];
  season: string[];
  yearFrom: string;
  yearTo: string;
  minScore: number;
  minRatings: number;
  tags: number[];
  tagMatch: "all" | "any";
  studios: StudioPick[];
  sort: string;
  order: string;
};

export const EMPTY_FILTERS: Filters = {
  q: "",
  type: [],
  status: [],
  season: [],
  yearFrom: "",
  yearTo: "",
  minScore: 0,
  minRatings: 0,
  tags: [],
  tagMatch: "all",
  studios: [],
  sort: "",
  order: "",
};

export function hasActiveFilters(f: Filters) {
  return (
    !!f.q.trim() ||
    f.type.length > 0 ||
    f.status.length > 0 ||
    f.season.length > 0 ||
    f.tags.length > 0 ||
    f.studios.length > 0 ||
    !!f.yearFrom ||
    !!f.yearTo ||
    f.minScore > 0 ||
    f.minRatings > 0
  );
}

const num = (v: string | null) => (v && !Number.isNaN(Number(v)) ? Number(v) : 0);

/** The URL is the source of truth on first load, so a filtered view can be shared. */
export function filtersFromParams(p: URLSearchParams): Filters {
  return {
    q: p.get("q") ?? "",
    type: p.getAll("type"),
    status: p.getAll("status"),
    season: p.getAll("season"),
    yearFrom: p.get("from") ?? "",
    yearTo: p.get("to") ?? "",
    minScore: num(p.get("score")),
    minRatings: num(p.get("ratings")),
    tags: p.getAll("tag").map(Number).filter(Boolean),
    tagMatch: p.get("match") === "any" ? "any" : "all",
    studios: p
      .getAll("studio")
      .map((s) => {
        const i = s.indexOf(":");
        return { id: Number(s.slice(0, i)), name: s.slice(i + 1) };
      })
      .filter((s) => s.id && s.name),
    sort: p.get("sort") ?? "",
    order: p.get("order") ?? "",
  };
}

export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  f.type.forEach((v) => p.append("type", v));
  f.status.forEach((v) => p.append("status", v));
  f.season.forEach((v) => p.append("season", v));
  if (f.yearFrom) p.set("from", f.yearFrom);
  if (f.yearTo) p.set("to", f.yearTo);
  if (f.minScore > 0) p.set("score", String(f.minScore));
  if (f.minRatings > 0) p.set("ratings", String(f.minRatings));
  f.tags.forEach((t) => p.append("tag", String(t)));
  if (f.tags.length > 1 && f.tagMatch === "any") p.set("match", "any");
  f.studios.forEach((s) => p.append("studio", `${s.id}:${s.name}`));
  if (f.sort) p.set("sort", f.sort);
  if (f.order) p.set("order", f.order);
  return p;
}

/** The query string the API's list endpoint expects. */
export function listQuery(f: Filters, limit: number, offset: number): string {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  f.type.forEach((v) => p.append("type", v));
  f.status.forEach((v) => p.append("status", v));
  f.season.forEach((v) => p.append("season", v));
  if (f.yearFrom) p.set("year_from", f.yearFrom);
  if (f.yearTo) p.set("year_to", f.yearTo);
  if (f.minScore > 0) p.set("min_score", String(f.minScore));
  if (f.minRatings > 0) p.set("min_ratings", String(f.minRatings));
  f.tags.forEach((t) => p.append("tag_id", String(t)));
  if (f.tags.length > 1) p.set("tag_match", f.tagMatch);
  f.studios.forEach((s) => p.append("studio_id", String(s.id)));
  const sort = f.sort || (f.q.trim() ? "relevance" : "members");
  p.set("sort", sort);
  if (f.order) p.set("order", f.order);
  p.set("limit", String(limit));
  p.set("offset", String(offset));
  return p.toString();
}
