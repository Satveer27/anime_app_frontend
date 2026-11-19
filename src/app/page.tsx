import { api, displayTitle, type AnimeStatistics, type AnimeSummary } from "@/lib/api";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Measure, type Gem } from "@/components/Measure";
import { Aggregates, Browse, DataSection, FinalCta, Footer, StatSheets } from "@/components/Sections";
import type { Sheet } from "@/components/StatSheet";

/** Steins;Gate: the API flags it "gets good", with a clear turning point. */
const TREND_ID = 9253;
/** A spread of shapes: a runaway hit, a slow burn, a classic, a hit, a crowd-pleaser and a disaster. */
const SHEET_IDS = [52991, 9253, 1, 16498, 30276, 38853];

export const revalidate = 3600;

function toSheet(s: AnimeStatistics): Sheet {
  const c = s.core;
  const st = s.statistics;
  const cohort = st.cohort;
  return {
    id: c.mal_id,
    title: displayTitle(c),
    image: c.image_url,
    meta: [c.type, c.year, c.episodes ? `${c.episodes} episodes` : null].filter(Boolean).join(", "),
    score: c.mal_score,
    rank: c.rank_mal,
    members: c.members_mal,
    dist: st.score_distribution.buckets.map((b) => ({ score: b.score, percentage: b.percentage })),
    totalVotes: st.score_distribution.total_votes,
    mean: st.score_distribution.mean,
    list: st.list_status,
    dropRate: st.list_status.drop_rate,
    cohort: cohort ? { rank: cohort.score.rank, size: cohort.cohort_size, type: cohort.type, from: cohort.year_from, to: cohort.year_to } : null,
  };
}

export default async function Home() {
  const [top, popular, dropped, gemsRaw, trend, byType, byYear, byTag, byStudio, bySeason, sheetData] = await Promise.all([
    api.anime("sort=score&limit=12"),
    api.anime("sort=members&limit=14"),
    api.mostDropped(5),
    api.hiddenGems(3),
    api.episodes(TREND_ID),
    api.byType(),
    api.byYear(),
    api.byTag(),
    api.byStudio(),
    api.bySeason(),
    Promise.all(SHEET_IDS.map((id) => api.statistics(id))),
  ]);

  const sheets = sheetData.filter((s): s is AnimeStatistics => !!s).map(toSheet);
  const trendInfo = sheetData[SHEET_IDS.indexOf(TREND_ID)];

  // Hidden-gem rows carry no cover art, so look each one up.
  const gems: Gem[] | null = gemsRaw
    ? await Promise.all(
        gemsRaw.items.map(async (g) => ({ ...g, image_url: (await api.statistics(g.mal_id))?.core.image_url ?? null })),
      )
    : null;

  const posters: AnimeSummary[] = (popular?.items ?? []).filter((a) => a.image_url);
  const total = top?.total ?? null;

  const years = (byYear?.items ?? [])
    .filter((y) => y.year >= 1960 && y.year <= 2025 && y.mean_score != null && y.scored_count >= 10)
    .map((y) => ({ year: y.year, count: y.anime_count, mean: y.mean_score as number }));

  const rank = (items: { name: string; mean_score: number | null; scored_count: number; anime_count: number }[] | undefined, minScored: number) =>
    (items ?? [])
      .filter((i) => i.mean_score != null && i.scored_count >= minScored)
      .sort((a, b) => (b.mean_score as number) - (a.mean_score as number))
      .slice(0, 8)
      .map((i) => ({ name: i.name, mean: i.mean_score as number, count: i.anime_count }));

  return (
    <>
      <Header />
      <main>
        <Hero total={total} posters={posters} />
        <Measure
          trendTitle={trendInfo ? displayTitle(trendInfo.core) : "Steins;Gate"}
          trend={trend}
          dropped={dropped?.items ?? null}
          gems={gems}
        />
        <StatSheets sheets={sheets} />
        <Aggregates years={years} genres={rank(byTag?.items, 300)} studios={rank(byStudio?.items, 80)} seasons={bySeason?.items ?? []} />
        <Browse items={top?.items ?? []} total={total} />
        <DataSection types={byType?.items ?? null} />
        <FinalCta total={total} />
      </main>
      <Footer />
    </>
  );
}
