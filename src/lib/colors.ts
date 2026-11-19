const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * Episode score to colour: red at 6.5 and below, through orange and yellow, to green at 9.5 and above.
 * Episode averages sit in a narrow band (most land between 7.5 and 9.5), so the scale is stretched across it.
 */
export function epColor(score: number): string {
  const t = clamp01((score - 6.5) / 3);
  return `hsl(${Math.round(t * 125)} ${58 + Math.round(t * 4)}% ${56 - Math.round(Math.sin(t * Math.PI) * 4)}%)`;
}

/** Vote bucket (1 to 10) to colour, on the full 1 to 10 range. */
export function voteColor(score: number): string {
  const t = clamp01((score - 1) / 8.5);
  return `hsl(${Math.round(t * 125)} 56% 54%)`;
}

export const EP_SCALE = [6.5, 7.25, 8, 8.75, 9.5];
