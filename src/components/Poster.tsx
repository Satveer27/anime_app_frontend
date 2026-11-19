import Image from "next/image";
import type { AnimeSummary } from "@/lib/api";
import { displayTitle } from "@/lib/api";

export function Poster({ anime, sizes, priority }: { anime: Pick<AnimeSummary, "title" | "title_english" | "image_url" | "mal_score">; sizes: string; priority?: boolean }) {
  return (
    <span className="poster">
      {anime.image_url ? (
        <Image src={anime.image_url} alt={`${displayTitle(anime)} cover`} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
      ) : null}
      {anime.mal_score ? <span className="score-tag num">{anime.mal_score.toFixed(2)}</span> : null}
    </span>
  );
}
