"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";
import { Chibi, type ChibiKind } from "./Chibi";

type Item = { href: string; label: string; kind: ChibiKind };

/** The main navigation on phones: a button in the header that opens a full-width panel of the same links. */
export function MobileMenu({ items }: { items: Item[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const panelId = useId();

  // Close when the page changes (state is keyed by path so no effect has to reset it).
  const [openedOn, setOpenedOn] = useState(path);
  const isOpen = open && openedOn === path;

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [isOpen]);

  return (
    <div className="mobile-menu">
      <button
        type="button"
        className="icon-btn menu-btn"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        onClick={() => {
          setOpenedOn(path);
          setOpen(!isOpen);
        }}
      >
        <span className="menu-bars" data-open={isOpen} aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <div id={panelId} className="menu-panel" data-open={isOpen} hidden={!isOpen}>
        <nav aria-label="Main menu">
          <ul>
            {items.map((n, i) => (
              <li key={n.href} style={{ ["--i" as string]: i }}>
                <Link href={n.href} onClick={() => setOpen(false)} className={path === n.href || path.startsWith(`${n.href}/`) ? "is-here" : undefined}>
                  <span className="menu-label">{n.label}</span>
                  <span className="menu-chibi" aria-hidden="true">
                    <Chibi kind={n.kind} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
