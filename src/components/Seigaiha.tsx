/** Original seigaiha-style wave field drawn in SVG; colours come from CSS variables. */
export function Seigaiha({ id, line = "var(--wave-line)", fill = "var(--bg)", size = 44 }: { id: string; line?: string; fill?: string; size?: number }) {
  const r = size;
  const rings = [1, 0.75, 0.5, 0.25];
  const front = [0, 2 * r];
  return (
    <svg width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <pattern id={id} width={2 * r} height={r} patternUnits="userSpaceOnUse">
          <g fill={fill} stroke={line} strokeWidth="1.5">
            {rings.map((k) => (
              <circle key={`b${k}`} cx={r} cy={0} r={r * k} />
            ))}
            {front.map((cx) =>
              rings.map((k) => <circle key={`f${cx}-${k}`} cx={cx} cy={r} r={r * k} />),
            )}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
