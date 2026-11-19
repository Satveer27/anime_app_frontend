import Link from "next/link";
import type { AnimeSummary } from "@/lib/api";
import { displayTitle } from "@/lib/api";
import { ArrowDown } from "./Icons";
import { Mascot } from "./Mascot";
import { PetalLink } from "./PetalLink";
import { AccentWords } from "./AccentWords";
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
      <span className="hero-brush jp" aria-hidden="true">
        数
      </span>
      <div className="wrap hero-grid">
        <div>
          <h1 id="hero-title" className="hero-title">
            <span className="line">
              <span>Which anime is</span>
            </span>
            <span className="line">
              <span>worth your</span>
            </span>
            <span className="line line-aw">
              <span className="accent">
                <AccentWords words={["weekend?", "evening?", "free time?"]} />
              </span>
            </span>
          </h1>
          <p className="hero-sub">
            Check the drop rate and the episode-by-episode scores before you press play.
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
          <Mascot kind="luffy" className="mascot-hero" pop={false} />
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
                  href={`/anime/${a.mal_id}`}
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
