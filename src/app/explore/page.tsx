import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";

export const metadata: Metadata = { title: "Explore: AnimePlanet" };

export default function ExplorePage() {
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingBlock: "clamp(72px, 12vw, 160px)", minHeight: "60vh" }}>
        <h1 style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1.05, letterSpacing: "-0.02em", maxWidth: "14ch" }}>
          The explorer is the next thing we are building.
        </h1>
        <p style={{ marginTop: 24, maxWidth: "34rem", color: "var(--ink-2)" }}>
          Search, filters and per-anime statistics are live in the API already. This page will put them in your hands.
        </p>
        <Link href="/" className="btn" style={{ marginTop: 40 }}>
          Back to the landing page
        </Link>
      </main>
      <Footer />
    </>
  );
}
