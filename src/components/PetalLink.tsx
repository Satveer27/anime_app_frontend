import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "./Icons";

/** Petal flight paths: [dx, dy, rotation, delay ms, size px]. Fired from the arrow disc on hover or focus. */
const PETALS: [number, number, number, number, number][] = [
  [-86, -64, -220, 0, 11],
  [-48, -92, 160, 40, 9],
  [-10, -78, -140, 90, 12],
  [34, -100, 210, 20, 10],
  [72, -70, -180, 70, 11],
  [104, -38, 250, 120, 9],
  [-120, -22, -260, 140, 8],
  [58, -48, 120, 170, 8],
];

export function PetalLink({ href, children, small, className = "" }: { href: string; children: ReactNode; small?: boolean; className?: string }) {
  return (
    <Link href={href} className={`btn${small ? " btn-sm" : ""} ${className}`.trim()}>
      <span className="btn-label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      <span className="btn-disc">
        <ArrowRight size={small ? 15 : 18} />
      </span>
      <span className="petals" aria-hidden="true">
        {PETALS.map(([dx, dy, r, d, s], i) => (
          <i key={i} style={{ ["--dx" as string]: `${dx}px`, ["--dy" as string]: `${dy}px`, ["--r" as string]: `${r}deg`, ["--del" as string]: `${d}ms`, ["--s" as string]: `${s}px` }} />
        ))}
      </span>
    </Link>
  );
}
