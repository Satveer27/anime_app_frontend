/**
 * Typed client for the AnimePlanet API. The base URL comes from NEXT_PUBLIC_API_URL (see .env.example).
 * Every call returns `null` on failure so a page can degrade instead of crashing the build.
 */

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const BASE = API_BASE;

/** The API's interactive docs, derived from the configured base URL. */
export const API_DOCS_URL = API_BASE ? `${API_BASE.replace(/\/api\/v1$/, "")}/docs` : null;

export type AnimeSummary = {
  mal_id: number;
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  year: number | null;
  episodes: number | null;
  mal_score: number | null;
  scored_by_mal: number | null;
  members_mal: number | null;
  rank_mal: number | null;
  image_url: string | null;
};

export type AnimeList = { items: AnimeSummary[]; total: number; limit: number; offset: number };

export type MostDroppedItem = {
  mal_id: number;
  title: string;
  type: string | null;
  year: number | null;
  mal_score: number | null;
  members_mal: number;
  dropped: number;
  started: number;
  drop_rate: number;
};

export type HiddenGemItem = {
  mal_id: number;
  title: string;
  type: string | null;
  year: number | null;
  mal_score: number;
  members_mal: number;
  scored_by_mal: number;
};

export type EpisodePoint = {
  episode_number: number;
  title: string;
  mal_score: number | null;
  smoothed_score: number | null;
};

export type EpisodeAnalysis = {
  mal_id: number;
  episodes: EpisodePoint[];
  trend: {
    verdict: string;
    turning_point_episode: number | null;
    baseline: number | null;
    mean_after_turning_point: number | null;
  };
};

export type AnimeStatistics = {
  core: AnimeSummary & { synopsis: string | null };
  statistics: {
    score_distribution: { buckets: { score: number; votes: number; percentage: number }[]; total_votes: number; mean: number };
    list_status: {
      watching: number;
      completed: number;
      on_hold: number;
      dropped: number;
      plan_to_watch: number;
      total: number;
      drop_rate: number;
      completion_rate: number;
    };
    cohort: { type: string; year_from: number; year_to: number; cohort_size: number; score: { rank: number; percentile: number } };
  };
};

export type YearStat = { year: number; anime_count: number; scored_count: number; mean_score: number | null };
export type TagStat = { tag_id: number; name: string; anime_count: number; scored_count: number; mean_score: number | null };
export type StudioStat = { studio_id: number; name: string; anime_count: number; scored_count: number; mean_score: number | null };
export type SeasonStat = { season: string; anime_count: number; scored_count: number; mean_score: number | null };

export type TypeStat = { type: string; label: string; anime_count: number; mean_score: number | null };

async function get<T>(path: string): Promise<T | null> {
  if (!BASE) return null; // not configured: pages degrade instead of crashing
  try {
    const res = await fetch(`${BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  anime: (params: string) => get<AnimeList>(`/anime?${params}`),
  mostDropped: (limit: number) => get<{ items: MostDroppedItem[] }>(`/statistics/most-dropped?limit=${limit}`),
  hiddenGems: (limit: number) => get<{ items: HiddenGemItem[] }>(`/statistics/hidden-gems?limit=${limit}`),
  episodes: (id: number) => get<EpisodeAnalysis>(`/anime/${id}/statistics/episodes`),
  statistics: (id: number) => get<AnimeStatistics>(`/anime/${id}/statistics`),
  byYear: () => get<{ items: YearStat[] }>(`/statistics/by-year`),
  byTag: () => get<{ items: TagStat[] }>(`/statistics/by-tag`),
  byStudio: () => get<{ items: StudioStat[] }>(`/statistics/by-studio`),
  bySeason: () => get<{ items: SeasonStat[] }>(`/statistics/by-season`),
  byType: () => get<{ items: TypeStat[] }>(`/statistics/by-type`),
};

export const displayTitle = (a: { title: string; title_english?: string | null }) => a.title_english || a.title;

export const compact = (n: number) =>
  new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

export const integer = (n: number) => new Intl.NumberFormat("en").format(n);
