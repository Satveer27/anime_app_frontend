import type { Metadata } from "next";
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { Mascot } from "@/components/Mascot";
import { Reveal } from "@/components/Reveal";
import { DataNote } from "@/components/DataNote";
import { AggregateBoards, PlatformList } from "@/components/StatisticsBoards";
import { genreRows, seasonRows, studioRows, typeRows, yearPoints } from "@/lib/aggregate";

export const metadata: Metadata = {
  title: "Statistics: AnimePlanet",
  description: "Hidden gems, most dropped, scores by year, genre, studio, type and season across all of MyAnimeList.",
};

export const revalidate = 3600;

export default async function StatisticsPage() {
  const [byYear, byType, bySeason, byTag, byStudio, gems, dropped] = await Promise.all([
    api.byYear(),
    api.byType(),
    api.bySeason(),
    api.byTag(),
    api.byStudio(100),
    api.hiddenGems(10),
    api.mostDropped(10),
  ]);

  const years = yearPoints(byYear?.items);
  const genres = genreRows(byTag?.items);
  const studios = studioRows(byStudio?.items);
  const types = typeRows(byType?.items);
  const seasons = seasonRows(bySeason?.items);

  return (
    <>
      <Header />
      <main>
        <section className="top-hero wrap" aria-labelledby="stats-title">
          <div>
            <h1 id="stats-title" className="page-title">
              The <em className="accent">numbers</em>
            </h1>
            <p className="page-lead">What all the anime add up to. Pick any genre, studio or type to see its anime in the explorer.</p>
          </div>
          <Mascot kind="tanjiro" className="top-mascot" pop={false} />
        </section>

        <div className="wrap stats-body">
          <section className="anime-section" aria-labelledby="gems-title">
            <Reveal>
              <h2 id="gems-title">Hidden gems</h2>
            </Reveal>
            {gems ? (
              <PlatformList
                kind="hidden-gems"
                initial={gems.items}
                total={gems.total}
                blurb={`Anime in the top ${Math.round((1 - gems.score_percentile) * 100)}% of their type by score and below the ${Math.round(gems.members_percentile * 100)}th percentile for members, with at least ${gems.min_scored_by.toLocaleString("en")} ratings.`}
              />
            ) : (
              <DataNote title="Hidden gems could not be loaded." seed={1}>
                The API did not respond.
              </DataNote>
            )}
          </section>

          <section className="anime-section" aria-labelledby="dropped-title">
            <Reveal>
              <h2 id="dropped-title">Most dropped</h2>
            </Reveal>
            {dropped ? (
              <PlatformList
                kind="most-dropped"
                initial={dropped.items}
                total={dropped.total}
                blurb={`Ranked by drop rate: dropped divided by everyone who started it. Only anime with at least ${dropped.min_members.toLocaleString("en")} members count.`}
              />
            ) : (
              <DataNote title="The most-dropped list could not be loaded." seed={2}>
                The API did not respond.
              </DataNote>
            )}
          </section>

          {byYear || byTag || byStudio ? (
            <AggregateBoards initial={{ years, genres, studios, types, seasons }} />
          ) : (
            <DataNote title="The aggregate statistics could not be loaded." seed={3}>
              The API did not respond. Refresh in a moment.
            </DataNote>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
