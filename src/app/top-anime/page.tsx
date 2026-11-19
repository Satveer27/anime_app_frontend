import type { Metadata } from "next";
import { TopPage } from "@/components/TopPage";

export const metadata: Metadata = {
  title: "Top anime: AnimePlanet",
  description: "The highest scored anime on MyAnimeList, ranked.",
};

export const revalidate = 3600;

export default function TopAnimePage() {
  return <TopPage title="Top anime" lead="The highest scored anime on MyAnimeList, best first." query="sort=score" kind="goku" />;
}
