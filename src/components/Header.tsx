import Link from "next/link";
import { Chibi, type ChibiKind } from "./Chibi";
import { MobileMenu } from "./MobileMenu";
import { PetalLink } from "./PetalLink";
import { ThemeToggle } from "./ThemeToggle";

const NAV: { href: string; label: string; kind: ChibiKind }[] = [
  { href: "/explore", label: "Explore", kind: "luffy" },
  { href: "/top-airing", label: "Top airing", kind: "naruto" },
  { href: "/top-anime", label: "Top anime", kind: "goku" },
  { href: "/compare", label: "Compare", kind: "gon" },
  { href: "/statistics", label: "Statistics", kind: "tanjiro" },
];

export function Header() {
  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="AnimePlanet home">
          AnimePlanet<span className="brand-dot" aria-hidden="true" />
        </Link>
        <nav className="nav-links" aria-label="Main">
          {NAV.map((n) => (
            <span key={n.href} className="nav-item">
              <Link href={n.href}>{n.label}</Link>
              <span className="peek" aria-hidden="true">
                <Chibi kind={n.kind} />
              </span>
            </span>
          ))}
        </nav>
        <div className="nav-actions">
          <ThemeToggle />
          <span className="header-cta">
            <PetalLink href="/explore" small>
              Search anime
            </PetalLink>
          </span>
          <MobileMenu items={NAV} />
        </div>
      </div>
    </header>
  );
}
