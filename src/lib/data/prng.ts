// Deterministic pseudo-random helpers so the seeded merchant story is identical on every load.

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof mulberry32>;

export const between = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
export const intBetween = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
export const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)];

export function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Scale positive weights so they sum exactly to `total`, rounded to `step`. */
export function distribute(weights: number[], total: number, step = 10): number[] {
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const out = weights.map((w) => Math.max(step, Math.round((w / sum) * total / step) * step));
  const diff = total - out.reduce((a, b) => a + b, 0);
  out[out.length - 1] += diff;
  return out;
}
