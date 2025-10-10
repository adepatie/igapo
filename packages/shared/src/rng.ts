// Deterministic RNG helpers
export function toNumberSeed(seedValue: string): number {
  let hash = 1779033703 ^ seedValue.length;
  for (let i = 0; i < seedValue.length; i += 1) {
    hash = Math.imul(hash ^ seedValue.charCodeAt(i), 3432918353);
    hash = (hash << 13) | (hash >>> 19);
  }
  hash =
    Math.imul(hash ^ (hash >>> 16), 2246822507) ^
    Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^= hash >>> 16) >>> 0;
}

export function mulberry32(a: number) {
  return function rng(): number {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom<T>(array: T[], rng: () => number): T {
  return array[Math.floor(rng() * array.length) % array.length];
}
