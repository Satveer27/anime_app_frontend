import type { Metadata } from "next";
import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { Explorer } from "@/components/explore/Explorer";

export const metadata: Metadata = {
  title: "Explore: AnimePlanet",
  description: "Search and filter every anime on MyAnimeList by genre, studio, year, score and more.",
};

export default function ExplorePage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<div className="wrap" style={{ minHeight: "70vh" }} />}>
          <Explorer />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
