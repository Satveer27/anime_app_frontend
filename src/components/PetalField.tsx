/**
 * Ambient sakura petals drifting down the whole page. Pure CSS (transform and opacity only),
 * fixed positions so server and client render the same markup.
 * [left %, size px, fall seconds, delay seconds, sway px, spin deg]
 */
const PETALS: [number, number, number, number, number, number][] = [
  [4, 11, 19, -2, 40, 300],
  [11, 9, 24, -11, 28, -260],
  [19, 13, 21, -6, 52, 340],
  [27, 8, 27, -17, 34, -300],
  [36, 12, 20, -9, 46, 280],
  [45, 10, 26, -4, 30, -320],
  [53, 14, 23, -14, 56, 360],
  [61, 9, 22, -1, 38, -240],
  [69, 12, 28, -19, 48, 300],
  [77, 10, 20, -7, 32, -280],
  [85, 13, 25, -12, 44, 330],
  [92, 9, 23, -5, 36, -310],
  [97, 11, 27, -15, 26, 260],
];

export function PetalField() {
  return (
    <div className="petal-field" aria-hidden="true">
      {PETALS.map(([left, size, dur, delay, sway, spin], i) => (
        <span
          key={i}
          className="drift"
          style={{
            left: `${left}%`,
            ["--s" as string]: `${size}px`,
            ["--dur" as string]: `${dur}s`,
            ["--del" as string]: `${delay}s`,
            ["--sway" as string]: `${sway}px`,
            ["--spin" as string]: `${spin}deg`,
          }}
        >
          <i />
        </span>
      ))}
    </div>
  );
}
