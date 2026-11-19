import Link from "next/link";
import { PetalLink } from "./PetalLink";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="AnimePlanet home">
          <span className="brand-mark jp" aria-hidden="true">
            惑
          </span>
          AnimePlanet
        </Link>
        <nav className="nav-links" aria-label="Sections">
          <Link href="/#measure">The stats</Link>
          <Link href="/#sheets">Stat sheets</Link>
          <Link href="/#browse">Top anime</Link>
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <PetalLink href="/explore" small>
            Explore
          </PetalLink>
        </div>
      </div>
    </header>
  );
}
