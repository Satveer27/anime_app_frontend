import Link from "next/link";
import type { AnimeSummary } from "@/lib/api";
import { displayTitle } from "@/lib/api";
import { ArrowDown } from "./Icons";
import { PetalLink } from "./PetalLink";
import { CountUp } from "./CountUp";
import { Poster } from "./Poster";
import { Seigaiha } from "./Seigaiha";

export function Hero({ total, posters }: { total: number | null; posters: AnimeSummary[] }) {
  const loop = [...posters, ...posters];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-waves">
        <Seigaiha id="sg-hero" />
      </div>
      <div className="wrap hero-grid">
        <div>
          <h1 id="hero-title" className="hero-title">
            <span className="line">
              <span>Which anime is</span>
            </span>
            <span className="line">
              <span>worth your weekend?</span>
            </span>
          </h1>
          <p className="hero-sub">
            Check the drop rate and the episode-by-episode scores before you press play. Every anime on MyAnimeList,
            analysed.
          </p>
          <div className="hero-actions">
            <PetalLink href="/explore">Start exploring</PetalLink>
            <a href="#measure" className="btn-text">
              <span className="btn-text-label">See the stats</span>
              <ArrowDown />
            </a>
          </div>
        </div>
        <div className="hero-side">
          {total ? (
            <div className="stamp">
              <div>
                <CountUp value={total} />
                <span>anime on MyAnimeList</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {posters.length ? (
        <div className="marquee" aria-label="Some of the highest scored anime">
          <div className="marquee-track">
            {loop.map((a, i) => {
              const dup = i >= posters.length;
              return (
                <Link
                  key={`${a.mal_id}-${i}`}
                  href="/explore"
                  className="marquee-item"
                  aria-hidden={dup || undefined}
                  tabIndex={dup ? -1 : undefined}
                  aria-label={dup ? undefined : displayTitle(a)}
                >
                  <Poster anime={a} sizes="188px" priority={i < 6} />
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
