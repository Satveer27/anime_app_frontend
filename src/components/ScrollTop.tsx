"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Every page renders its own header, so Next cannot tell where a page "starts" and can leave the new page
 * scrolled partway down. This puts each new page back at the top, unless the link points at a #section.
 */
export function ScrollTop() {
  const path = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [path]);
  return null;
}
