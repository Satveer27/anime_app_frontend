"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { API_BASE, compact, displayTitle, integer, type AnimeList, type AnimeSummary } from "@/lib/api";
import { DataNote } from "./DataNote";

const PAGE = 25;

/** A plain ranked list (no filters). The first page is rendered on the server; "Show more" loads the rest. */
export function RankedList({ initial, total, query, metric }: { initial: AnimeSummary[]; total: number; query: string; metric: "score" | "members" }) {
  const [items, setItems] = useState(initial);
  const [all, setAll] = useState(total);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const more = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const res = await fetch(`${API_BASE}/anime?${query}&limit=${PAGE}&offset=${items.length}`);
      if (!res.ok) throw new Error(String(res.status));
      const d = (await res.json()) as AnimeList;
      setItems((cur) => [...cur, ...d.items]);
      setAll(d.total);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ranked">
      <ol className="ranked-list">
        {items.map((a, i) => (
          <li key={a.mal_id} className="ranked-row" style={{ ["--i" as string]: Math.min(i % PAGE, 14) }}>
            <Link href={`/anime/${a.mal_id}`} className="ranked-link">
              <span className="ranked-no num">{i + 1}</span>
              <span className="poster ranked-poster">
                {a.image_url ? <Image src={a.image_url} alt="" fill sizes="80px" style={{ objectFit: "cover" }} /> : null}
              </span>
              <span className="ranked-text">
                <span className="ranked-title">{displayTitle(a)}</span>
                <span className="ranked-meta num">
                  {[a.type, a.year, a.episodes ? `${a.episodes} eps` : null, a.members_mal ? `${compact(a.members_mal)} members` : null].filter(Boolean).join(", ")}
                </span>
              </span>
              <span className="ranked-score">
                <b className="num">{metric === "score" ? (a.mal_score?.toFixed(2) ?? "n/a") : a.members_mal ? compact(a.members_mal) : "n/a"}</b>
                <span>{metric === "score" ? "MAL score" : "members"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
      {failed ? (
        <DataNote compact title="Could not load more." seed={items.length}>
          The API did not respond. Try again.
        </DataNote>
      ) : null}
      <div className="more">
        <p className="num">
          Showing {integer(items.length)} of {integer(all)}
        </p>
        {items.length < all ? (
          <button type="button" className="btn-quiet" onClick={more} disabled={loading}>
            {loading ? "Loading..." : "Show more"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
