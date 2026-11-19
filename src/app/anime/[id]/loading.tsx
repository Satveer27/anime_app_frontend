import { Header } from "@/components/Header";

/** Shown the moment an anime link is clicked, while the API answers. Mirrors the real page's shape. */
export default function Loading() {
  return (
    <>
      <Header />
      <main className="wrap skel-page" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading anime statistics</p>
        <div className="skel-hero">
          <div className="skel skel-poster" />
          <div className="skel-lines">
            <div className="skel skel-line" style={{ width: "62%", height: 44 }} />
            <div className="skel skel-line" style={{ width: "38%" }} />
            <div className="skel skel-line" style={{ width: "80%" }} />
            <div className="skel skel-line" style={{ width: "70%" }} />
          </div>
        </div>
        <div className="skel-grid">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skel skel-card" style={{ ["--i" as string]: i }} />
          ))}
        </div>
        <div className="skel skel-wide" />
      </main>
    </>
  );
}
