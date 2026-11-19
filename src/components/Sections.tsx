import Link from "next/link";
import type { AnimeSummary, SeasonStat, TypeStat } from "@/lib/api";
import { API_DOCS_URL, compact, displayTitle, integer } from "@/lib/api";
import { PetalLink } from "./PetalLink";
import { SakuraBranch } from "./SakuraBranch";
import { Leaderboard, YearChart, type Rank, type YearPoint } from "./Aggregates";
import { StatSheet, type Sheet } from "./StatSheet";
import { Poster } from "./Poster";
import { Reveal } from "./Reveal";
import { Seigaiha } from "./Seigaiha";

/* ---------------- Browse: a few of the best-loved ---------------- */

export function Browse({ items, total }: { items: AnimeSummary[]; total: number | null }) {
  return (
    <section id="browse" className="section" style={{ paddingTop: 0 }} aria-labelledby="browse-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 id="browse-title">The current top twelve</h2>
          <p>Highest scored on MyAnimeList today, pulled live.</p>
        </Reveal>

        {items.length ? (
          <div className="browse-grid">
            {items.map((a, i) => (
              <Reveal key={a.mal_id} className={`browse-item${i === 0 ? " big" : ""}`} delay={(i % 5) * 60}>
                <Link href="/explore">
                  <Poster anime={a} sizes={i === 0 ? "(max-width: 1100px) 50vw, 40vw" : "(max-width: 720px) 50vw, 20vw"} />
                  <h3>{displayTitle(a)}</h3>
                  <p className="num">
                    {[a.type, a.year, a.members_mal ? `${compact(a.members_mal)} members` : null].filter(Boolean).join(", ")}
                  </p>
                </Link>
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="unavailable">The anime list is unavailable right now. The API did not respond.</p>
        )}

        <div className="browse-more">
          <PetalLink href="/explore">Browse all {total ? integer(total) : ""} anime</PetalLink>
        </div>
      </div>
    </section>
  );
}

/* ---------------- The data: where it comes from + catalogue mix ---------------- */

const STEPS = [
  { title: "Fetched", body: "A scheduled job pulls each anime from MyAnimeList through the Tenrai API." },
  { title: "Kept raw", body: "Responses are saved untouched, so a parsing fix never means fetching everything again." },
  { title: "Cleaned", body: "Details, statistics, reviews and episodes are parsed into Postgres." },
  { title: "Served", body: "A cached FastAPI backend answers every chart on this page." },
];

const SEG_COLORS = ["var(--ink-2)", "var(--teal-line)", "var(--ink-3)", "var(--surface-2)", "var(--teal)", "var(--surface-2)"];

export function DataSection({ types }: { types: TypeStat[] | null }) {
  const total = types?.reduce((s, t) => s + t.anime_count, 0) ?? 0;
  return (
    <section id="data" className="section data-band" aria-labelledby="data-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 id="data-title">Updated every week</h2>
          <p>
            Airing anime refresh weekly and the most popular titles monthly. This page asks the API again every hour.
          </p>
        </Reveal>

        <Reveal plain>
          <ol className="flow">
            {STEPS.map((s, i) => (
              <li key={s.title} style={{ ["--i" as string]: i }}>
                <div className="flow-dot" />
                <span className="flow-line" />
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        {types && total ? (
          <Reveal plain className="mix">
            <h3 style={{ fontSize: "1.375rem", marginBottom: 20 }}>What the data covers</h3>
            <div className="mix-bar" role="img" aria-label="Anime count by type">
              {types.map((t, i) => (
                <div
                  key={t.type}
                  className="mix-seg"
                  style={{ flexGrow: t.anime_count, ["--seg" as string]: SEG_COLORS[i % SEG_COLORS.length], ["--i" as string]: i }}
                />
              ))}
            </div>
            <ul className="mix-legend">
              {types.map((t) => (
                <li key={t.type}>
                  <strong className="num">
                    {integer(t.anime_count)}
                  </strong>
                  <span>{t.label}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}

/* ---------------- Final call to action ---------------- */

export function FinalCta({ total }: { total: number | null }) {
  return (
    <section className="cta" aria-labelledby="cta-title">
      <div className="waves">
        <Seigaiha id="sg-cta" line="#2a6a6f" fill="#123a3f" size={52} />
      </div>
      <Reveal plain className="cta-branch">
        <SakuraBranch />
      </Reveal>
      <div className="wrap cta-inner">
        <Reveal>
          <h2 id="cta-title">Start exploring</h2>
          <p>Search and sort {total ? `all ${integer(total)}` : "every"} anime.</p>
          <PetalLink href="/explore">Explore the data</PetalLink>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Per-anime stat sheets ---------------- */

export function StatSheets({ sheets }: { sheets: Sheet[] }) {
  return (
    <section id="sheets" className="section" style={{ paddingTop: 0 }} aria-labelledby="sheets-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 id="sheets-title">Every anime gets a stat sheet</h2>
          <p>Score spread, how many finished or quit, and the rank among shows from the same years. Pick one.</p>
        </Reveal>
        <Reveal className="sheet-reveal" delay={60}>
          {sheets.length ? <StatSheet sheets={sheets} /> : <p className="unavailable">Stat sheets are unavailable right now. The API did not respond.</p>}
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Aggregated statistics ---------------- */

export function Aggregates({ years, genres, studios, seasons }: { years: YearPoint[]; genres: Rank[]; studios: Rank[]; seasons: SeasonStat[] }) {
  const scored = seasons.filter((s) => s.mean_score != null);
  const hi = scored.length ? Math.max(...scored.map((s) => s.mean_score as number)) : 0;
  const lo = scored.length ? Math.min(...scored.map((s) => s.mean_score as number)) : 0;
  return (
    <section id="zoom" className="section data-band" aria-labelledby="zoom-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 id="zoom-title">Zoom out</h2>
          <p>All of them at once, and what stands out.</p>
        </Reveal>

        <div className="zoom-grid">
          {years.length ? (
            <Reveal plain className="zoom-card zoom-year" delay={40}>
              <h3>Average score, year by year</h3>
              <YearChart points={years} />
            </Reveal>
          ) : null}

          {genres.length && studios.length ? (
            <Reveal plain className="zoom-card" delay={120}>
              <h3>Who scores highest</h3>
              <Leaderboard genres={genres} studios={studios} />
            </Reveal>
          ) : null}

          {scored.length ? (
            <Reveal plain className="zoom-card zoom-season" delay={200}>
              <h3>Does the season matter?</h3>
              <p className="season-answer">Barely. The best season beats the worst by {(hi - lo).toFixed(2)} points.</p>
              <ul className="season-list">
                {scored.map((s, i) => (
                  <li key={s.season} style={{ ["--i" as string]: i }} className={s.mean_score === hi ? "top" : undefined}>
                    <span className="season-name">{s.season}</span>
                    <span className="season-bar" aria-hidden="true">
                      <span style={{ height: `${((s.mean_score as number) / hi) * 100}%` }} />
                    </span>
                    <span className="num">{(s.mean_score as number).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-cols">
          <p>
            Anime data comes from <a href="https://myanimelist.net">MyAnimeList</a> through the Tenrai API. AnimePlanet is
            an independent project and is not affiliated with MyAnimeList.
          </p>
          <p>
            Built by <a href="https://github.com/Satveer27">Satveer</a> with Next.js and a FastAPI backend.
          </p>
          <p>
            <a href="https://github.com/Satveer27/Anime_App_Backend">Backend source</a>
            <br />
            {API_DOCS_URL ? <a href={API_DOCS_URL}>API documentation</a> : null}
          </p>
        </div>
        <div className="footer-word" aria-hidden="true">
          AnimePlanet
        </div>
      </div>
    </footer>
  );
}
