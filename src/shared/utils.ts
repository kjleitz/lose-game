// Utility functions for random numbers
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Deterministic RNG utilities (no casts, simple and explicit)
export interface SeededRng {
  next(): number; // [0,1)
  int(min: number, max: number): number; // inclusive
  float(min: number, max: number): number;
}

export function hashStringToInt(value: string): number {
  // 32-bit FNV-1a hash
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // ensure unsigned
}

export function createSeededRng(seed: number): SeededRng {
  // Mulberry32 PRNG
  let s = seed >>> 0;
  const next = (): number => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int(min: number, max: number): number {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return Math.floor(next() * (hi - lo + 1)) + lo;
    },
    float(min: number, max: number): number {
      const lo = Math.min(min, max);
      const hi = Math.max(min, max);
      return next() * (hi - lo) + lo;
    },
  };
}
