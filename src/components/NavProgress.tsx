"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * A thin progress bar for page changes. Anime pages fetch from the API, so a click can take a second;
 * this starts on the click (not when the page arrives) so the site always shows it heard you.
 * It creeps towards 90%, then completes and fades when the new route has rendered.
 */
export function NavProgress() {
  const path = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState<"idle" | "run" | "done">("idle");
  const timer = useRef<number | undefined>(undefined);

  // a click on an internal link starts the bar
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      window.clearTimeout(timer.current);
      setState("run");
      // give up quietly if the route never changes (e.g. an error), so the bar cannot hang forever
      timer.current = window.setTimeout(() => setState("idle"), 15000);
    };
    // capture phase: next/link calls preventDefault in its own handler, which would hide the click from us
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // the route changed: finish the bar
  useEffect(() => {
    window.clearTimeout(timer.current);
    const t = window.setTimeout(() => {
      setState((s) => (s === "run" ? "done" : s));
      timer.current = window.setTimeout(() => setState("idle"), 420);
    }, 0);
    return () => window.clearTimeout(t);
  }, [path, search]);

  return <div className="navbar-progress" data-state={state} role="progressbar" aria-hidden={state === "idle"} aria-label="Loading page" />;
}
