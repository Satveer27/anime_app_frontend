import type { Metadata } from "next";
import { TopPage } from "@/components/TopPage";

export const metadata: Metadata = {
  title: "Top airing: AnimePlanet",
  description: "The best scored anime that are airing right now.",
};

export const revalidate = 3600;

export default function TopAiringPage() {
  return <TopPage title="Top airing" lead="The best scored anime that are on air right now, with enough ratings to trust the score." query="status=airing&sort=score&min_ratings=1000" kind="naruto" />;
}
