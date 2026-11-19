"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type Props = {
  as?: ElementType;
  className?: string;
  delay?: number;
  /** Fire as soon as this fraction is visible. */
  threshold?: number;
  children: ReactNode;
  style?: CSSProperties;
  /** Mark the element as a reveal target (opacity + rise). Charts only need the `in` class. */
  plain?: boolean;
};

/** Adds the `in` class once the element scrolls into view. Content stays visible without JS. */
export function Reveal({ as: Tag = "div", className, delay = 0, threshold = 0.18, children, style, plain }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold, rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      className={className}
      {...(plain ? {} : { "data-reveal": "" })}
      style={{ ...style, ["--d" as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
