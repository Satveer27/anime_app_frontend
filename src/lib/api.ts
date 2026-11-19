/**
 * Typed client for the AnimePlanet API. The base URL comes from NEXT_PUBLIC_API_URL (see .env.example).
 * Types mirror the backend's Pydantic schemas (app/statistics/schemas.py and friends). Every derived field
 * the backend documents as optional is nullable here, so a missing value can never throw.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const BASE = API_BASE;

/** The API's interactive docs, derived from the configured base URL. */
export const API_DOCS_URL = API_BASE ? `${API_BASE.replace(/\/api\/v1$/, "")}/docs` : null;

/* ---------------- lists ---------------- */

export type AnimeSummary = {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  status?: string | null;
  year: number | null;
  episodes: number | null;
  mal_score: number | null;
  scored_by_mal: number | null;
  members_mal: number | null;
  favorites_mal?: number | null;
  rank_mal: number | null;
  popularity_mal?: number | null;
  image_url: string | null;
};

export type AnimeList = { items: AnimeSummary[]; total: number; limit: number; offset: number };

/* ---------------- platform lists ---------------- */

type ListRow = { mal_id: number; title: string; type: string; year: number | null; mal_score: number | null; members_mal: number | null };

export type MostDroppedItem = ListRow & { dropped: number; started: number; drop_rate: number };
export type HiddenGemItem = ListRow & { scored_by_mal: number; score_percentile: number; members_percentile: number };

export type MostDropped = { min_members: number; total: number; limit: number; offset: number; items: MostDroppedItem[] };
export type HiddenGems = {
  min_ratings: number;
  score_percentile: number;
  members_percentile: number;
  min_scored_by: number;
  total: number;
  limit: number;
  offset: number;
  items: HiddenGemItem[];
};

/* ---------------- per anime ---------------- */

export type ListStatus = {
  watching: number;
  completed: number;
  on_hold: number;
  dropped: number;
  plan_to_watch: number;
  total: number;
  watching_share: number | null;
  completed_share: number | null;
  on_hold_share: number | null;
  dropped_share: number | null;
  plan_to_watch_share: number | null;
  completion_rate: number | null;
  drop_rate: number | null;
  watching_rate: number | null;
};

export type ScoreBucket = { score: number; votes: number | null; percentage: number | null };
export type ScoreDistribution = { buckets: ScoreBucket[]; total_votes: number | null; mean: number | null; mode: number | null };
export type Polarization = { standard_deviation: number | null; low_vote_share: number | null; high_vote_share: number | null };
export type Engagement = { favorites_per_member: number | null; scored_by_ratio: number | null; plan_to_watch_share: number | null; low_sample: boolean | null };
export type CohortMetric = { rank: number | null; percentile: number | null };
export type Cohort = {
  type: string | null;
  year_from: number | null;
  year_to: number | null;
  cohort_size: number;
  score: CohortMetric | null;
  popularity: CohortMetric | null;
  favorites: CohortMetric | null;
  drop_rate: CohortMetric | null;
  completion_rate: CohortMetric | null;
  hidden_gem_gap: number | null;
  is_hidden_gem: boolean | null;
};

export type Review = {
  mal_id: number;
  score: number | null;
  review: string;
  review_url: string | null;
  username: string | null;
  date: string | null;
  is_spoiler: boolean;
  is_preliminary: boolean;
  episodes_watched: number | null;
  reaction_overall: number | null;
};

export type AnimeCore = {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  status: string | null;
  rating: string | null;
  source_material: string | null;
  season: string | null;
  year: number | null;
  episodes: number | null;
  duration_minutes: number | null;
  aired_from: string | null;
  aired_to: string | null;
  mal_score: number | null;
  scored_by_mal: number | null;
  members_mal: number | null;
  favorites_mal: number | null;
  rank_mal: number | null;
  popularity_mal: number | null;
  synopsis: string | null;
  image_url: string | null;
};

export type NamedId = { mal_id: number; name: string };

export type AnimeStatistics = {
  core: AnimeCore;
  /** Null when no statistics row is stored for this anime. */
  statistics: {
    list_status: ListStatus;
    score_distribution: ScoreDistribution;
    polarization: Polarization;
    engagement: Engagement;
    cohort: Cohort;
  } | null;
  tags: NamedId[];
  studios: NamedId[];
  reviews: { sample_note: string; items: Review[] };
};

/* ---------------- episodes ---------------- */

export type Verdict = "gets_good" | "consistently_good" | "declines" | "flat" | "insufficient_data";

export type EpisodePoint = {
  episode_number: number;
  title: string | null;
  title_japanese: string | null;
  aired: string | null;
  synopsis: string | null;
  filler: boolean;
  recap: boolean;
  mal_score: number | null;
  smoothed_score: number | null;
};

export type EpisodeAnalysis = {
  mal_id: number;
  episodes: EpisodePoint[];
  trend: {
    verdict: Verdict;
    scored_episodes: number;
    baseline_size: number | null;
    baseline: number | null;
    threshold: number | null;
    smoothing_window: number | null;
    turning_point_episode: number | null;
    mean_after_turning_point: number | null;
    change: number | null;
    dips_after_turning_point: number | null;
    end_mean: number | null;
  };
  segments: { start_episode: number; end_episode: number; scored_episodes: number; mean_score: number; change_from_previous: number | null }[];
  yearly: { year: number; episode_count: number; scored_episodes: number; mean_score: number | null }[];
  best: { mal_score: number; episode_numbers: number[] } | null;
  worst: { mal_score: number; episode_numbers: number[] } | null;
  filler_comparison: { filler_episodes: number; filler_mean: number | null; non_filler_episodes: number; non_filler_mean: number | null };
  breakdown: {
    total_episodes: number;
    filler_episodes: number;
    filler_share: number | null;
    recap_episodes: number;
    recap_share: number | null;
    regular_episodes: number;
    regular_share: number | null;
  };
  volatility: { standard_deviation: number; mean_episode_change: number } | null;
  hook: {
    first_episodes: number;
    first_mean: number;
    rest_mean: number;
    hook_difference: number;
    latest_episode: number;
    latest_score: number;
    latest_vs_rest: number;
  } | null;
};

/* ---------------- aggregates ---------------- */

type Group = { anime_count: number; scored_count: number; mean_score: number | null; median_score?: number | null; total_members?: number };
export type YearStat = Group & { year: number };
export type TagStat = Group & { tag_id: number; name: string };
export type StudioStat = Group & { studio_id: number; name: string };
export type SeasonStat = Group & { season: string };
export type TypeStat = Group & { type: string; label: string };

/* ---------------- fetching ---------------- */

export type Fetched<T> = { data: T | null; status: number };

/** Like `get`, but keeps the HTTP status so a page can tell "not found" from "the API is down". */
export async function fetchJson<T>(path: string, revalidate = 3600): Promise<Fetched<T>> {
  if (!BASE) return { data: null, status: 0 };
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
    if (!res.ok) return { data: null, status: res.status };
    return { data: (await res.json()) as T, status: res.status };
  } catch {
    return { data: null, status: 0 };
  }
}

async function get<T>(path: string): Promise<T | null> {
  return (await fetchJson<T>(path)).data;
}

export const api = {
  anime: (params: string) => get<AnimeList>(`/anime?${params}`),
  mostDropped: (limit: number, extra = "") => get<MostDropped>(`/statistics/most-dropped?limit=${limit}${extra}`),
  hiddenGems: (limit: number, extra = "") => get<HiddenGems>(`/statistics/hidden-gems?limit=${limit}${extra}`),
  episodes: (id: number) => get<EpisodeAnalysis>(`/anime/${id}/statistics/episodes`),
  statistics: (id: number) => get<AnimeStatistics>(`/anime/${id}/statistics`),
  byYear: (o?: AggScope) => get<{ items: YearStat[] }>(`/statistics/by-year${aggQuery(o)}`),
  byTag: (o?: AggScope) => get<{ items: TagStat[] }>(`/statistics/by-tag${aggQuery(o)}`),
  byStudio: (limit = 100, o?: AggScope) => get<{ items: StudioStat[]; total: number }>(`/statistics/by-studio${aggQuery(o, `limit=${limit}`)}`),
  bySeason: (o?: AggScope) => get<{ items: SeasonStat[] }>(`/statistics/by-season${aggQuery(o)}`),
  byType: (o?: AggScope) => get<{ items: TypeStat[] }>(`/statistics/by-type${aggQuery(o, "", false)}`),
};

/** Scope shared by every aggregate endpoint: which type, and how many ratings an anime needs to count. */
export type AggScope = { type?: string; minRatings?: number };

/** Query string for an aggregate call. `by-type` takes no type filter, so it can switch that off. */
export function aggQuery(o?: AggScope, extra = "", withType = true): string {
  const q = new URLSearchParams(extra);
  if (withType && o?.type) q.set("type", o.type);
  if (o?.minRatings != null) q.set("min_ratings", String(o.minRatings));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const displayTitle = (a: { title: string; title_english?: string | null }) => a.title_english || a.title;

export const compact = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const integer = (n: number) => new Intl.NumberFormat("en").format(n);

/** "12.4%" from a 0-1 share, or an em-free placeholder when the API sent null. */
export const pct = (share: number | null | undefined, digits = 1) =>
  share == null ? "n/a" : `${(share * 100).toFixed(digits)}%`;
