import { api, displayTitle, type AnimeStatistics, type AnimeSummary } from "@/lib/api";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Measure, type Gem } from "@/components/Measure";
import { Aggregates, Browse, DataSection, FinalCta, Footer, StatSheets } from "@/components/Sections";
import { toSheet } from "@/lib/sheet";
import { genreRows, studioRows, topByScore, yearPoints } from "@/lib/aggregate";

/** Steins;Gate: the API flags it "gets good", with a clear turning point. */
const TREND_ID = 9253;
/** A spread of shapes: a runaway hit, a slow burn, a classic, a hit, a crowd-pleaser and a disaster. */
const SHEET_IDS = [52991, 9253, 1, 16498, 30276, 38853];

export const revalidate = 3600;

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

  const sheets = sheetData.filter((s): s is AnimeStatistics => !!s).map(toSheet).filter((s): s is NonNullable<typeof s> => !!s);
  const trendInfo = sheetData[SHEET_IDS.indexOf(TREND_ID)];

  // Hidden-gem rows carry no cover art, so look each one up.
  const gems: Gem[] | null = gemsRaw
    ? await Promise.all(
        gemsRaw.items.map(async (g) => ({ ...g, image_url: (await api.statistics(g.mal_id))?.core.image_url ?? null })),
      )
    : null;

  const posters: AnimeSummary[] = (popular?.items ?? []).filter((a) => a.image_url);
  const total = top?.total ?? null;

  const years = yearPoints(byYear?.items);
  // The same rows the Statistics page shows, so "who scores highest" never disagrees between the two.
  const rank = (rows: ReturnType<typeof genreRows>) => topByScore(rows, 8).map((r) => ({ name: r.name, mean: r.mean, count: r.count }));

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
        <Aggregates years={years} genres={rank(genreRows(byTag?.items))} studios={rank(studioRows(byStudio?.items))} seasons={bySeason?.items ?? []} />
        <Browse items={top?.items ?? []} total={total} />
        <DataSection types={byType?.items ?? null} />
        <FinalCta total={total} />
      </main>
      <Footer />
    </>
  );
}
