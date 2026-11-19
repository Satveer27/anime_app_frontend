import type { ReactNode } from "react";
import { Chibi, CHIBI_KINDS, type ChibiKind } from "./Chibi";

/**
 * A red note for anything that failed to load or has no data, with a sad character beside it.
 * Pass `seed` (an id, a title) to keep the same character for the same thing on every render.
 */
export function DataNote({
  title,
  children,
  seed = 0,
  kind,
  action,
  compact,
}: {
  title: string;
  children?: ReactNode;
  seed?: number;
  kind?: ChibiKind;
  action?: ReactNode;
  compact?: boolean;
}) {
  const who = kind ?? CHIBI_KINDS[Math.abs(seed) % CHIBI_KINDS.length];
  return (
    <div className={`data-note${compact ? " data-note-compact" : ""}`} role="status">
      <div className="data-note-char" aria-hidden="true">
        <Chibi kind={who} mood="sad" />
      </div>
      <div className="data-note-text">
        <p className="data-note-title">{title}</p>
        {children ? <p className="data-note-body">{children}</p> : null}
        {action ? <div className="data-note-action">{action}</div> : null}
      </div>
    </div>
  );
}
