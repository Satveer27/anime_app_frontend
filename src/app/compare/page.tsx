import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@/lib/api";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";
import { Mascot } from "@/components/Mascot";
import { Compare } from "@/components/compare/Compare";

export const metadata: Metadata = {
  title: "Compare two anime: AnimePlanet",
  description: "Put two anime side by side: score, drop rate, how people rated them and how their episodes hold up.",
};

export const revalidate = 3600;

export default async function ComparePage() {
  const popular = await api.anime("sort=members&limit=8&offset=0");
  return (
    <>
      <Header />
      <main>
        <section className="top-hero wrap" aria-labelledby="cmp-title">
          <div>
            <h1 id="cmp-title" className="page-title">
              Compare two <em className="accent">anime</em>
            </h1>
            <p className="page-lead">Stuck between two? Put them side by side before you choose.</p>
          </div>
          <Mascot kind="gon" className="top-mascot" pop={false} />
        </section>
        <div className="wrap" style={{ paddingBottom: 56 }}>
          <Suspense fallback={null}>
            <Compare picks={popular?.items ?? []} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
