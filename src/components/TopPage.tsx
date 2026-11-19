import { api } from "@/lib/api";
import { Header } from "./Header";
import { Footer } from "./Sections";
import { Mascot } from "./Mascot";
import { DataNote } from "./DataNote";
import { RankedList } from "./RankedList";
import type { ChibiKind } from "./Chibi";

/** Shared shell for the two filter-free ranking pages. */
export async function TopPage({ title, lead, query, kind }: { title: string; lead: string; query: string; kind: ChibiKind }) {
  const first = await api.anime(`${query}&limit=25&offset=0`);
  return (
    <>
      <Header />
      <main>
        <section className="top-hero wrap" aria-labelledby="top-title">
          <div>
            <h1 id="top-title" className="page-title">
              {title.split(" ").slice(0, -1).join(" ")} <em className="accent">{title.split(" ").slice(-1)[0]}</em>
            </h1>
            <p className="page-lead">{lead}</p>
          </div>
          <Mascot kind={kind} className="top-mascot" pop={false} />
        </section>
        <div className="wrap" style={{ paddingBottom: 112 }}>
          {first ? (
            <RankedList initial={first.items} total={first.total} query={query} metric={query.includes("sort=members") ? "members" : "score"} />
          ) : (
            <DataNote title="The ranking could not be loaded." seed={title.length}>
              The API did not respond. Refresh in a moment.
            </DataNote>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
