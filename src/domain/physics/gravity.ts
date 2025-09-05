// Shared gravity helpers for space mode. No casts, no any.
// Applies inverse-square gravity outside a body and linear gravity inside (uniform density).

export type GravityKind = "planet" | "star";

export interface GravityBody {
  x: number;
  y: number;
  r: number; // radius
  density: number; // relative density scalar
  kind: GravityKind;
}

export interface PositionLike {
  x: number;
  y: number;
}

export interface VelocityLike {
  dx: number;
  dy: number;
}

export const GRAVITY_G = 120; // tuned gravitational constant

// Reference radius used to keep star surface gravity playable across large R
const REFERENCE_R = 100;

function effectiveDensity(body: GravityBody): number {
  if (body.kind === "star") {
    return body.density * (REFERENCE_R / Math.max(1, body.r));
  }
  return body.density;
}

export function effectiveGM(body: GravityBody, gravConst: number = GRAVITY_G): number {
  // M ∝ density * R^3
  const rho = effectiveDensity(body);
  return gravConst * rho * body.r * body.r * body.r;
}

export interface GravitySample {
  ax: number; // radial acceleration x
  ay: number; // radial acceleration y
  accel: number; // magnitude of radial acceleration
  nx: number; // radial unit x (toward body)
  ny: number; // radial unit y (toward body)
  dist: number; // distance to center
  gm: number; // effective GM used
}

export function sampleGravityAt(pos: PositionLike, body: GravityBody): GravitySample | null {
  const dx = body.x - pos.x;
  const dy = body.y - pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 1e-6) return null;
  const influence = body.r * 3;
  if (dist > influence) return null;

  const nx = dx / dist;
  const ny = dy / dist;
  const gm = effectiveGM(body);
  // Outside surface: inverse-square; inside: linear to center
  const accel = dist >= body.r ? gm / (dist * dist) : (gm / (body.r * body.r * body.r)) * dist;
  return { ax: nx * accel, ay: ny * accel, accel, nx, ny, dist, gm };
}

export function planetOrbitalAssist(
  vel: VelocityLike,
  sample: GravitySample,
  dt: number,
): { dvx: number; dvy: number } {
  // Only meaningful outside the surface
  if (sample.dist < 0) return { dvx: 0, dvy: 0 };
  const dist = sample.dist;
  const tnx = -sample.ny; // tangential unit (clockwise)
  const tny = sample.nx;
  const currentTangential = vel.dx * tnx + vel.dy * tny;
  const desiredTangential = Math.sqrt(Math.max(0, sample.gm / dist));
  const assistGain = 0.8; // how quickly we approach desired v_t per second
  const maxAssist = sample.accel * 0.7; // do not exceed a fraction of radial accel
  const deltaVPerSec = (desiredTangential - currentTangential) * assistGain;
  const clamped = Math.max(-maxAssist, Math.min(maxAssist, deltaVPerSec));
  return { dvx: tnx * clamped * dt, dvy: tny * clamped * dt };
}

export function applyGravityTo(
  pos: PositionLike,
  vel: VelocityLike,
  bodies: GravityBody[],
  dt: number,
  options?: { assistPlanets?: boolean },
): { influencedByPlanet: boolean } {
  let influencedByPlanet = false;
  for (const body of bodies) {
    const sample = sampleGravityAt(pos, body);
    if (!sample) continue;

    vel.dx += sample.ax * dt;
    vel.dy += sample.ay * dt;

    if (options?.assistPlanets && body.kind === "planet" && sample.dist >= body.r) {
      const assist = planetOrbitalAssist(vel, sample, dt);
      vel.dx += assist.dvx;
      vel.dy += assist.dvy;
      influencedByPlanet = true;
    } else if (body.kind === "planet") {
      influencedByPlanet = true;
    }
  }
  return { influencedByPlanet };
}
