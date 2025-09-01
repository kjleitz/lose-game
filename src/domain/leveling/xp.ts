export function xpRequired(level: number): number {
  // Levels start at 1. Clamp lower bound to 1.
  const lvl = Math.max(1, Math.floor(level));
  // Quadratic curve: 50*L^2 + 50*L
  const required = 50 * lvl * lvl + 50 * lvl;
  return Math.round(required);
}

export function clampXp(xp: number): number {
  return Number.isFinite(xp) && xp >= 0 ? Math.floor(xp) : 0;
}
