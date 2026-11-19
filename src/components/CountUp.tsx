"use client";

import { useEffect, useRef } from "react";

/** Counts up to `value` once on mount. Server-renders the final number so there is no empty state. */
export function CountUp({ value, duration = 1400, delay = 500 }: { value: number; duration?: number; delay?: number }) {
  const ref = useRef<HTMLElement>(null);
  const fmt = new Intl.NumberFormat("en");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    el.textContent = "0";
    const timeout = window.setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = fmt.format(Math.round(value * eased));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration, delay]);

  return (
    <strong ref={ref} className="num">
      {fmt.format(value)}
    </strong>
  );
}
