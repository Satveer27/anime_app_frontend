import type { SeasonStat, StudioStat, TagStat, TypeStat, YearStat } from "./api";

/**
 * One definition of "who scores highest", used by the landing page and the Statistics page,
 * so both always show the same genres and studios in the same order.
 */
export const GENRE_MIN_ANIME = 100;
export const STUDIO_MIN_ANIME = 40;
/** The API's own default for how many ratings an anime needs to count in a score average. */
export const DEFAULT_MIN_RATINGS = 50;

export type GroupRow = { key: string; name: string; mean: number; count: number; href?: string };

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Counted = { mean_score: number | null; scored_count: number; anime_count: number };

function rows<T extends Counted>(items: T[] | undefined, min: number, key: (t: T) => string, name: (t: T) => string, href?: (t: T) => string): GroupRow[] {
  return (items ?? [])
    .filter((i) => i.mean_score != null && i.scored_count >= min)
    .map((i) => ({ key: key(i), name: name(i), mean: i.mean_score as number, count: i.anime_count, href: href?.(i) }));
}

export const genreRows = (items?: TagStat[]) => rows(items, GENRE_MIN_ANIME, (t) => String(t.tag_id), (t) => t.name, (t) => `/explore?tag=${t.tag_id}`);
export const studioRows = (items?: StudioStat[]) =>
  rows(items, STUDIO_MIN_ANIME, (s) => String(s.studio_id), (s) => s.name, (s) => `/explore?studio=${s.studio_id}:${encodeURIComponent(s.name)}`);
export const typeRows = (items?: TypeStat[]) => rows(items, 1, (t) => t.type, (t) => t.label, (t) => `/explore?type=${t.type}`);
export const seasonRows = (items?: SeasonStat[]) => rows(items, 1, (s) => s.season, (s) => cap(s.season));

export type YearPoint = { year: number; count: number; mean: number };

export const yearPoints = (items?: YearStat[]): YearPoint[] =>
  (items ?? [])
    .filter((y) => y.year >= 1960 && y.year <= 2025 && y.mean_score != null && y.scored_count >= 10)
    .map((y) => ({ year: y.year, count: y.anime_count, mean: y.mean_score as number }));

/** Highest average first. */
export const topByScore = (r: GroupRow[], n: number) => [...r].sort((a, b) => b.mean - a.mean).slice(0, n);
