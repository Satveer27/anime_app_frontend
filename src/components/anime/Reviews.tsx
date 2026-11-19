"use client";

import { useState } from "react";
import type { Review } from "@/lib/api";
import { voteColor } from "@/lib/colors";
import { DataNote } from "../DataNote";

const verdict = (score: number) => (score >= 8 ? "Positive" : score >= 6 ? "Mixed" : "Negative");

const when = (d: string | null) => (d ? new Date(d).toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : null);

export function Reviews({ items, note, seed }: { items: Review[]; note: string; seed: number }) {
  const [shown, setShown] = useState(4);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (set: Set<number>, id: number, apply: (s: Set<number>) => void) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  };

  return (
    <section id="reviews" className="anime-section" aria-labelledby="reviews-title">
      <h2 id="reviews-title">What reviewers say</h2>
      {items.length === 0 ? (
        <DataNote title="No reviews stored for this anime." seed={seed}>
          The pipeline keeps a sample of MyAnimeList&apos;s most helpful reviews, and none were found for this one.
        </DataNote>
      ) : (
        <>
          <p className="section-lead">{note.startsWith("A sample") ? "A sample of MyAnimeList's most helpful reviews, not every review." : note}</p>
          <ReviewMood items={items} />
          <ul className="review-list">
            {items.slice(0, shown).map((r) => {
              const hidden = r.is_spoiler && !revealed.has(r.mal_id);
              const long = r.review.length > 420;
              const open = expanded.has(r.mal_id);
              return (
                <li key={r.mal_id} className="review" style={r.score != null ? { ["--tone" as string]: voteColor(r.score) } : undefined}>
                  <div className="review-head">
                    {r.score != null ? (
                      <span className="score-chip num" style={{ background: voteColor(r.score) }}>
                        {r.score}/10 <span className="score-verdict">{verdict(r.score)}</span>
                      </span>
                    ) : null}
                    <strong>{r.username ?? "A MAL user"}</strong>
                    <span className="review-meta num">
                      {[when(r.date), r.episodes_watched != null ? `watched ${r.episodes_watched} episodes` : null, r.reaction_overall ? `${r.reaction_overall} found it helpful` : null, r.is_preliminary ? "written early" : null]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                  {hidden ? (
                    <button type="button" className="btn-quiet" onClick={() => toggle(revealed, r.mal_id, setRevealed)}>
                      Contains spoilers. Show review
                    </button>
                  ) : (
                    <>
                      <p className="review-body">{long && !open ? `${r.review.slice(0, 420).trim()}...` : r.review}</p>
                      <div className="review-actions">
                        {long ? (
                          <button type="button" className="link-btn" onClick={() => toggle(expanded, r.mal_id, setExpanded)}>
                            {open ? "Show less" : "Read more"}
                          </button>
                        ) : null}
                        {r.review_url ? (
                          <a href={r.review_url} target="_blank" rel="noreferrer" className="link-btn">
                            On MyAnimeList
                          </a>
                        ) : null}
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {items.length > shown ? (
            <div className="more">
              <button type="button" className="btn-quiet" onClick={() => setShown((s) => s + 4)}>
                Show more reviews
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

/** How the sampled reviews split: a quick read on whether reviewers lean positive or negative. */
function ReviewMood({ items }: { items: Review[] }) {
  const scored = items.filter((r) => r.score != null) as (Review & { score: number })[];
  if (scored.length < 3) return null;
  const groups = [
    { label: "Positive", n: scored.filter((r) => r.score >= 8).length, color: voteColor(9) },
    { label: "Mixed", n: scored.filter((r) => r.score >= 6 && r.score < 8).length, color: voteColor(6.5) },
    { label: "Negative", n: scored.filter((r) => r.score < 6).length, color: voteColor(2) },
  ];
  return (
    <div className="mood">
      <div className="mood-bar" role="img" aria-label={groups.map((g) => `${g.n} ${g.label.toLowerCase()}`).join(", ")}>
        {groups.filter((g) => g.n > 0).map((g) => (
          <span key={g.label} style={{ flexGrow: g.n, background: g.color }} />
        ))}
      </div>
      <p className="mood-legend num">
        {groups.map((g) => (
          <span key={g.label}>
            <i style={{ background: g.color }} /> {g.n} {g.label.toLowerCase()}
          </span>
        ))}
        <span className="mood-note">of {scored.length} sampled reviews (8 and up is positive, below 6 negative)</span>
      </p>
    </div>
  );
}
