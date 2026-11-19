import { displayTitle, type AnimeStatistics } from "@/lib/api";
import type { Sheet } from "@/components/StatSheet";

/**
 * Turns the API's per-anime statistics payload into the shape the stat sheet renders.
 * Returns null when the API has no statistics row for the anime. Every nullable field is handled.
 */
export function toSheet(s: AnimeStatistics): Sheet | null {
  const c = s.core;
  const st = s.statistics;
  if (!st) return null;
  const cohort = st.cohort;
  return {
    id: c.mal_id,
    title: displayTitle(c),
    image: c.image_url,
    meta: [c.type, c.year, c.episodes ? `${c.episodes} episodes` : null].filter(Boolean).join(", "),
    score: c.mal_score,
    rank: c.rank_mal,
    members: c.members_mal,
    dist: st.score_distribution.buckets.map((b) => ({ score: b.score, percentage: b.percentage ?? 0 })),
    totalVotes: st.score_distribution.total_votes ?? 0,
    mean: st.score_distribution.mean ?? 0,
    list: st.list_status,
    dropRate: st.list_status.drop_rate ?? 0,
    cohort:
      cohort && cohort.score && cohort.score.rank != null && cohort.type && cohort.year_from && cohort.year_to
        ? { rank: cohort.score.rank, size: cohort.cohort_size, type: cohort.type, from: cohort.year_from, to: cohort.year_to }
        : null,
  };
}
