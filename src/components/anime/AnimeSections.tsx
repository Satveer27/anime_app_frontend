import Image from "next/image";
import Link from "next/link";
import type { AnimeStatistics, CohortMetric, EpisodePoint } from "@/lib/api";
import { epColor } from "@/lib/colors";
import { compact, integer, pct } from "@/lib/api";
import { DataNote } from "../DataNote";
import { Reveal } from "../Reveal";
import { ScoreDist, StatusBar } from "../Viz";


/* ---------------- hero ---------------- */

export function AnimeHero({ data, episodes }: { data: AnimeStatistics; episodes?: EpisodePoint[] | null }) {
  const c = data.core;
  const title = c.title_english || c.title;
  const meta = [c.type, c.status, c.season && c.year ? `${c.season[0].toUpperCase()}${c.season.slice(1)} ${c.year}` : c.year, c.episodes ? `${c.episodes} episode${c.episodes === 1 ? "" : "s"}` : episodes && episodes.length ? `${episodes.length} episodes so far` : null, c.duration_minutes ? `${c.duration_minutes} min each` : null].filter(Boolean);
  // At most 60 cells: a long series is averaged into 60 equal runs.
  const eps = (episodes ?? []).filter((e) => e.mal_score != null);
  const cells = Math.min(60, episodes?.length ?? 0);
  const strip: (number | null)[] =
    eps.length >= 3 && episodes
      ? Array.from({ length: cells }, (_, i) => {
          const from = Math.floor((i * episodes.length) / cells);
          const to = Math.max(from + 1, Math.floor(((i + 1) * episodes.length) / cells));
          const got = episodes.slice(from, to).filter((e) => e.mal_score != null) as (EpisodePoint & { mal_score: number })[];
          return got.length ? got.reduce((s, e) => s + e.mal_score, 0) / got.length : null;
        })
      : [];
  const synopsis = c.synopsis ? c.synopsis.replace(/\n+\(Source:.*\)$/s, "").trim() : null;

  return (
    <section className="anime-hero wrap" aria-labelledby="anime-title">
      <div className="anime-poster">
        <span className="poster">
          {c.image_url ? <Image src={c.image_url} alt={`${title} cover`} fill priority sizes="(max-width: 860px) 60vw, 320px" style={{ objectFit: "cover" }} /> : null}
        </span>
      </div>
      <div className="anime-info">
        <h1 id="anime-title" className="anime-title">
          {title}
        </h1>
        {c.title_japanese && c.title_japanese.toLowerCase() !== title.toLowerCase() && c.title_japanese.toLowerCase() !== c.title.toLowerCase() ? <p className="anime-jp jp">{c.title_japanese}</p> : null}
        <ul className="anime-meta num" aria-label="Details">
          {meta.map((m) => (
            <li key={String(m)}>{m}</li>
          ))}
        </ul>

        <dl className="anime-nums">
          <div>
            <dt>MAL score</dt>
            <dd className="num">{c.mal_score?.toFixed(2) ?? "n/a"}</dd>
          </div>
          <div>
            <dt>Score rank</dt>
            <dd className="num">{c.rank_mal ? `#${integer(c.rank_mal)}` : "n/a"}</dd>
          </div>
          <div>
            <dt>Popularity</dt>
            <dd className="num">{c.popularity_mal ? `#${integer(c.popularity_mal)}` : "n/a"}</dd>
          </div>
          <div>
            <dt>Members</dt>
            <dd className="num">{c.members_mal ? compact(c.members_mal) : "n/a"}</dd>
          </div>
          <div>
            <dt>Favorites</dt>
            <dd className="num">{c.favorites_mal ? compact(c.favorites_mal) : "n/a"}</dd>
          </div>
        </dl>

        {strip.length ? (
          <a href="#episodes" className="ep-strip" aria-label="Episode scores at a glance. Jump to the episode list.">
            <span className="ep-strip-cells" aria-hidden="true">
              {strip.map((v, i) => (
                <i key={i} style={v != null ? { background: epColor(v) } : undefined} />
              ))}
            </span>
            <span className="ep-strip-label">Every episode, red to green</span>
          </a>
        ) : null}

        {data.tags.length || data.studios.length ? (
          <div className="anime-links">
            {data.studios.map((s) => (
              <Link key={`s${s.mal_id}`} href={`/explore?studio=${s.mal_id}:${encodeURIComponent(s.name)}`} className="chip chip-studio">
                {s.name}
              </Link>
            ))}
            {data.tags.map((t) => (
              <Link key={`t${t.mal_id}`} href={`/explore?tag=${t.mal_id}`} className="chip">
                {t.name}
              </Link>
            ))}
          </div>
        ) : null}

        {synopsis ? (
          <details className="anime-synopsis">
            <summary>
              <span className="synopsis-clip">{synopsis.length > 300 ? `${synopsis.slice(0, 300).trim()}...` : synopsis}</span>
              {synopsis.length > 300 ? <span className="synopsis-more">Read the full synopsis</span> : null}
            </summary>
            <p>{synopsis}</p>
          </details>
        ) : null}

        <p className="anime-ext">
          <a href={`https://myanimelist.net/anime/${c.mal_id}`} target="_blank" rel="noreferrer">
            View on MyAnimeList
          </a>
          <Link href={`/compare?a=${c.mal_id}`} className="btn-quiet anime-compare">Compare with another</Link>
          {c.rating ? <span>Rated {c.rating}</span> : null}
          {c.source_material ? <span>Source: {c.source_material}</span> : null}
        </p>
      </div>
    </section>
  );
}

/* ---------------- scores ---------------- */

export function ScoresSection({ stats, title, seed }: { stats: AnimeStatistics["statistics"]; title: string; seed: number }) {
  if (!stats) {
    return (
      <section id="scores" className="anime-section" aria-labelledby="scores-title">
        <h2 id="scores-title">Scores and viewers</h2>
        <DataNote title="No statistics are stored for this anime yet." seed={seed}>
          {title} exists in the catalogue, but the pipeline has not collected its score votes or list counts.
        </DataNote>
      </section>
    );
  }
  const { score_distribution: dist, polarization: pol, engagement: eng, list_status: ls } = stats;
  const hasDist = dist.buckets.some((b) => (b.percentage ?? 0) > 0);
  const spread = pol.standard_deviation;
  const verdict = spread == null ? null : spread < 1.3 ? "Voters mostly agree." : spread < 1.9 ? "Some disagreement." : "Divisive.";

  return (
    <section id="scores" className="anime-section" aria-labelledby="scores-title">
      <Reveal>
        <h2 id="scores-title">Scores and viewers</h2>
      </Reveal>

      <div className="anime-grid">
        <Reveal plain className="panel" delay={30}>
          <div className="panel-title">
            <strong>How people scored it</strong>
            <span className="num">{dist.total_votes != null ? `${integer(dist.total_votes)} votes` : "vote count unavailable"}</span>
          </div>
          {hasDist ? (
            <>
              <ScoreDist buckets={dist.buckets} mode={dist.mode} />
              <p className="sheet-note num">
                Average {dist.mean != null ? dist.mean.toFixed(2) : "n/a"}. Most common score: {dist.mode ?? "n/a"}.
              </p>
            </>
          ) : (
            <DataNote compact title="No score votes stored." seed={seed + 1}>
              The histogram needs the ten score buckets, and none came back for this anime.
            </DataNote>
          )}
        </Reveal>

        <Reveal plain className="panel" delay={90}>
          <div className="panel-title">
            <strong>Do voters agree?</strong>
            <span>{verdict ?? "n/a"}</span>
          </div>
          {pol.low_vote_share != null && pol.high_vote_share != null ? (
            <div className="split-bars">
              <Bar label="Gave it a 9 or 10" value={pol.high_vote_share} tone="good" />
              <Bar label="Gave it a 1 to 4" value={pol.low_vote_share} tone="bad" />
            </div>
          ) : (
            <p className="unavailable">Vote split unavailable.</p>
          )}
          <p className="sheet-note num">Spread of votes (standard deviation): {pol.standard_deviation != null ? pol.standard_deviation.toFixed(2) : "n/a"}. Higher means more disagreement.</p>
        </Reveal>
      </div>

      <Reveal plain className="panel" delay={60}>
        <div className="panel-title">
          <strong>Where members are with it</strong>
          <span className="num">{integer(ls.total)} lists</span>
        </div>
        <StatusBar list={ls} />
        <div className="rate-row">
          <div className="fact">
            <strong className="num">{pct(ls.completion_rate)}</strong>
            <span>of those who started it finished it{ls.completion_rate == null ? " (n/a while airing)" : ""}</span>
          </div>
          <div className="fact">
            <strong className="num">{pct(ls.drop_rate)}</strong>
            <span>of those who started it dropped it</span>
          </div>
          <div className="fact">
            <strong className="num">{pct(ls.watching_rate)}</strong>
            <span>are still watching</span>
          </div>
        </div>
        <p className="sheet-note">Rates leave out people who only plan to watch it, because planning is not engagement.</p>
      </Reveal>

      <Reveal plain className="panel" delay={60}>
        <div className="panel-title">
          <strong>How much do people care?</strong>
        </div>
        <div className="rate-row">
          <div className="fact">
            <strong className="num">{eng.favorites_per_member != null ? `${(eng.favorites_per_member * 100).toFixed(1)}%` : "n/a"}</strong>
            <span>of members favorited it</span>
          </div>
          <div className="fact">
            <strong className="num">{pct(eng.scored_by_ratio, 0)}</strong>
            <span>of members rated it</span>
          </div>
          <div className="fact">
            <strong className="num">{pct(eng.plan_to_watch_share, 0)}</strong>
            <span>have it on a backlog</span>
          </div>
        </div>
        {eng.low_sample ? (
          <DataNote compact title="Few members rated this one." seed={seed + 2}>
            Treat its score with care: a small number of votes can swing it.
          </DataNote>
        ) : null}
      </Reveal>
    </section>
  );
}

function Bar({ label, value, tone }: { label: string; value: number; tone: "good" | "bad" }) {
  return (
    <div className="split-bar">
      <div className="drop-meta">
        <span>{label}</span>
        <strong className="num">{(value * 100).toFixed(1)}%</strong>
      </div>
      <div className="drop-track" aria-hidden="true">
        <div className={`drop-fill${tone === "good" ? " fill-good" : ""}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
      </div>
    </div>
  );
}

/* ---------------- against its era ---------------- */

type MetricRow = { label: string; m: CohortMetric | null | undefined; text: (p: number) => string };

export function CohortSection({ stats, seed }: { stats: AnimeStatistics["statistics"]; seed: number }) {
  if (!stats) return null;
  const c = stats.cohort;
  const era = c.year_from && c.year_to ? (c.year_from === c.year_to ? `${c.year_from}` : `${c.year_from} to ${c.year_to}`) : "its era";
  const group = `${integer(c.cohort_size)} ${c.type ?? ""} anime from ${era}`.replace("  ", " ");

  const rows: MetricRow[] = [
    { label: "Score", m: c.score, text: (p) => (p >= 0.995 ? "Scored higher than every other anime in the group" : `Scored higher than ${Math.round(p * 100)}% of them`) },
    { label: "Popularity", m: c.popularity, text: (p) => (p >= 0.995 ? "The most popular in the group" : `More popular than ${Math.round(p * 100)}%`) },
    { label: "Favorites", m: c.favorites, text: (p) => (p >= 0.995 ? "Favorited more per member than any other in the group" : `Favorited more per member than ${Math.round(p * 100)}%`) },
    { label: "Drop rate", m: c.drop_rate, text: (p) => (p >= 0.995 ? "Dropped less often than any other in the group" : `Dropped less often than ${Math.round(p * 100)}%`) },
    { label: "Completion", m: c.completion_rate, text: (p) => (p >= 0.995 ? "Finished more often than any other in the group" : `Finished more often than ${Math.round(p * 100)}%`) },
  ];
  const missing = rows.filter((r) => r.m?.percentile == null).map((r) => r.label.toLowerCase());

  return (
    <section id="era" className="anime-section" aria-labelledby="era-title">
      <Reveal>
        <h2 id="era-title">Against its own era</h2>
        <p className="section-lead">
          Compared with {group}. Bars show the percentile within that group, not a score.{c.cohort_size < 50 ? " It is a small group, so read the ranks loosely." : ""}
        </p>
      </Reveal>

      <Reveal plain className="panel" delay={40}>
        {c.is_hidden_gem != null ? (
          <p className={`gem-flag${c.is_hidden_gem ? " is-gem" : ""}`}>
            {c.is_hidden_gem ? "A hidden gem: " : "Not a hidden gem: "}
            {c.hidden_gem_gap == null
              ? "the gap between score and popularity is not available."
              : Math.abs(c.hidden_gem_gap) < 0.005
                ? "its score and popularity rank level."
                : `its score ranks ${c.hidden_gem_gap >= 0 ? "above" : "below"} its popularity by ${Math.abs(c.hidden_gem_gap * 100).toFixed(0)} percentile points.`}
          </p>
        ) : null}

        <ul className="cohort-list">
          {rows
            .filter((r) => r.m?.percentile != null)
            .map((r, i) => (
              <li key={r.label} style={{ ["--i" as string]: i }}>
                <div className="drop-meta">
                  <strong>{r.label}</strong>
                  <span className="num">
                    {r.m?.rank != null ? `#${integer(r.m.rank)} of ${integer(c.cohort_size)}` : ""}
                  </span>
                </div>
                <div className={`drop-track${c.cohort_size < 50 ? " dim" : ""}`} aria-hidden="true">
                  <div className="drop-fill fill-good" style={{ width: `${(r.m?.percentile as number) * 100}%` }} />
                </div>
                <span className="drop-sub">{r.text(r.m?.percentile as number)}</span>
              </li>
            ))}
        </ul>

        {missing.length ? (
          <DataNote compact title={`No ranking on ${missing.join(", ")}.`} seed={seed + 3}>
            There were too few comparable anime to rank {missing.length === 1 ? "that measure" : "those measures"}. A ranking needs a large enough group with enough ratings.
          </DataNote>
        ) : null}
      </Reveal>
    </section>
  );
}
