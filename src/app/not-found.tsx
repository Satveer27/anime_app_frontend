import Link from "next/link";
import { DataNote } from "@/components/DataNote";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Sections";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap" style={{ paddingBlock: "clamp(56px, 9vw, 120px)", minHeight: "60vh" }}>
        <h1 className="page-title">
          Lost <em className="accent">somewhere</em>
        </h1>
        <div style={{ marginTop: 32 }}>
          <DataNote title="That page does not exist." seed={404}>
            The link may be old, or the anime id is wrong. Search the catalogue instead.
          </DataNote>
        </div>
        <p style={{ marginTop: 32 }}>
          <Link href="/explore" className="btn-quiet" style={{ display: "inline-flex", alignItems: "center" }}>
            Go to the explorer
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
