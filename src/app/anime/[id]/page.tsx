import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJson, type AnimeStatistics, type EpisodeAnalysis } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { DataNote } from "@/components/DataNote";
import { AnimeHero, CohortSection, ScoresSection } from "@/components/anime/AnimeSections";
import { EpisodeSection } from "@/components/anime/EpisodeSection";
import { Reviews } from "@/components/anime/Reviews";

/** Short on purpose: if the API was briefly down, a cached error page should not stick around. */
export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

const parseId = (raw: string) => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  if (!id) return { title: "Anime not found: AnimePlanet" };
  const { data } = await fetchJson<AnimeStatistics>(`/anime/${id}/statistics`);
  const name = data ? data.core.title_english || data.core.title : null;
  return {
    title: name ? `${name}: stats and episode scores | AnimePlanet` : "Anime: AnimePlanet",
    description: name ? `Score distribution, drop rate, episode-by-episode scores and reviews for ${name}.` : undefined,
  };
}

export default async function AnimePage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();

  const [stats, eps] = await Promise.all([
    fetchJson<AnimeStatistics>(`/anime/${id}/statistics`, 300),
    fetchJson<EpisodeAnalysis>(`/anime/${id}/statistics/episodes`, 300),
  ]);
  if (stats.status === 404) notFound();

  if (!stats.data) {
    return (
      <>
        <Header />
        <main className="wrap" style={{ paddingBlock: "clamp(56px, 9vw, 120px)", minHeight: "60vh" }}>
          <DataNote title="This anime could not be loaded." seed={id}>
            The API did not respond{stats.status ? ` (it answered ${stats.status})` : ""}. Try again in a moment, or go back to the explorer.
          </DataNote>
          <p style={{ marginTop: 32 }}>
            <Link href="/explore" className="btn-quiet" style={{ display: "inline-flex", alignItems: "center" }}>
              Back to explore
            </Link>
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const d = stats.data;
  const title = d.core.title_english || d.core.title;
  // Long series carry a megabyte of synopses; trim them so the page stays light.
  const episodes = eps.data ? { ...eps.data, episodes: eps.data.episodes.map((e) => ({ ...e, synopsis: e.synopsis && e.synopsis.length > 700 ? `${e.synopsis.slice(0, 700).trim()}...` : e.synopsis })) } : null;

  return (
    <>
      <Header />
      <main>
        <AnimeHero data={d} episodes={episodes?.episodes ?? null} />
        <nav className="anime-nav wrap" aria-label="On this page">
          <a href="#episodes">Episodes</a>
          <a href="#scores">Scores</a>
          <a href="#era">Against its era</a>
          <a href="#reviews">Reviews</a>
        </nav>
        <div className="wrap anime-body">
          <EpisodeSection data={episodes} title={title} seed={id} />
          <ScoresSection stats={d.statistics} title={title} seed={id} />
          <CohortSection stats={d.statistics} seed={id} />
          <Reviews items={d.reviews.items} note={d.reviews.sample_note} seed={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
