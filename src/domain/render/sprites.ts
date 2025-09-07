import type { TemplateId } from "../game/items/ItemTemplates";

// Generic sprite cache with themeable variants
interface CachedSprite {
  img: HTMLImageElement;
  loaded: boolean;
}

const spriteCache: Map<string, CachedSprite> = new Map();

// Vite will transform these into hashed URLs at build time
const RAW_SPRITES = import.meta.glob("/src/assets/sprites/*/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});
const SPRITE_FILES: Record<string, string> = {};
for (const [keyPath, urlValue] of Object.entries(RAW_SPRITES)) {
  if (typeof urlValue === "string") SPRITE_FILES[keyPath] = urlValue;
}

function resolveSpriteUrl(key: string, variant: SpriteVariant): string | null {
  // Try exact match first
  const exact = `/src/assets/sprites/${key}/${variant}.svg`;
  if (Object.prototype.hasOwnProperty.call(SPRITE_FILES, exact)) return SPRITE_FILES[exact];
  // Try numbered frames e.g. art-deco-1.svg, art-deco-2.svg
  const base = `/src/assets/sprites/${key}/${variant}`;
  const candidates: string[] = Object.keys(SPRITE_FILES).filter((path) =>
    path.startsWith(base + "-"),
  );
  if (candidates.length > 0) {
    candidates.sort((left, right) => left.localeCompare(right));
    return SPRITE_FILES[candidates[0]];
  }
  // As a last resort, pick any available variant for the key
  const anyForKey: string[] = Object.keys(SPRITE_FILES).filter((path) =>
    path.startsWith(`/src/assets/sprites/${key}/`),
  );
  if (anyForKey.length > 0) {
    anyForKey.sort((left, right) => left.localeCompare(right));
    return SPRITE_FILES[anyForKey[0]];
  }
  return null;
}

export type SpriteVariant = string;

interface SpriteConfig {
  defaultVariant: SpriteVariant;
  overrides: Record<string, SpriteVariant>;
}

const config: SpriteConfig = {
  defaultVariant: "classic",
  overrides: {},
};

export function setSpriteDefaultVariant(variant: SpriteVariant): void {
  config.defaultVariant = variant;
}

export function setSpriteOverrides(overrides: Record<string, SpriteVariant>): void {
  // Replace wholesale to avoid stale keys lingering
  config.overrides = { ...overrides };
}

export function setSpriteConfig(next: Partial<SpriteConfig>): void {
  if (typeof next.defaultVariant === "string") config.defaultVariant = next.defaultVariant;
  if (next.overrides) config.overrides = { ...next.overrides };
  // Invalidate top-level sprite refs so new theme takes effect immediately
  thrusterImg = null;
  enemyThrusterImg = null;
}

function getVariantForKey(key: string): SpriteVariant {
  return config.overrides[key] ?? config.defaultVariant;
}

function spritePath(key: string): string {
  const variant = getVariantForKey(key);
  const url = resolveSpriteUrl(key, variant);
  // If resolution fails, fall back to an impossible path to avoid 404 spam
  return url ?? `/__missing_sprite__/${key}/${variant}.svg`;
}

function getSpriteByKey(key: string): CachedSprite {
  const path = spritePath(key);
  const existing = spriteCache.get(path);
  if (existing) return existing;
  const img = new window.Image();
  img.src = path;
  const record: CachedSprite = { img, loaded: false };
  img.onload = (): void => {
    record.loaded = true;
  };
  spriteCache.set(path, record);
  return record;
}

// Expose URL builder for UI previews. If variant is provided, use it instead
// of the currently configured one.
export function getSpriteUrlForKey(key: string, variant?: SpriteVariant): string {
  if (variant != null)
    return resolveSpriteUrl(key, variant) ?? `/__missing_sprite__/${key}/${variant}.svg`;
  return spritePath(key);
}

export function drawShipTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
): void {
  const { img } = getSpriteByKey("ship");
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

// Module-level cache for the thruster SVG image
let thrusterImg: HTMLImageElement | null = null;
// Smoothed player thruster scale so size transitions are not abrupt
let playerThrusterScaleSmoothed: number | null = null;
let playerThrusterScaleLastMs = 0;
// Offscreen canvas for tinting aux thruster sprite
let auxThrusterTintCanvas: HTMLCanvasElement | null = null;

// Trail history for thruster effects
interface PlayerTrailPoint {
  x: number;
  y: number;
  angle: number;
  timestamp: number;
  power: number;
  scale: number;
}
interface EnemyTrailPoint {
  x: number;
  y: number;
  angle: number;
  timestamp: number;
  power: number;
}
const playerThrusterTrail: PlayerTrailPoint[] = [];
const enemyThrusterTrails = new Map<string, EnemyTrailPoint[]>();
const TRAIL_LIFETIME = 180; // milliseconds (shorter for quicker fade)
const TRAIL_MAX_POINTS = 40; // Maximum trail points to keep

export function drawThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
  power = 1,
  flameMult = 1,
): void {
  if (!thrusterImg) {
    const { img } = getSpriteByKey("thruster");
    thrusterImg = img;
    // Image will be ready when needed
  }

  // Calculate target thruster scale (matches main thruster rendering)
  const targetScale = (0.8 + 1.2 * power) * flameMult;
  // Smooth the scale to avoid popping on boost/slowdown
  const nowMs = Date.now();
  if (playerThrusterScaleSmoothed === null) {
    playerThrusterScaleSmoothed = targetScale;
    playerThrusterScaleLastMs = nowMs;
  } else {
    const dtSec = Math.max(0, Math.min(0.2, (nowMs - playerThrusterScaleLastMs) / 1000));
    const tau = 0.12; // seconds; lower = snappier
    const alpha = 1 - Math.exp(-dtSec / tau);
    playerThrusterScaleSmoothed =
      playerThrusterScaleSmoothed + (targetScale - playerThrusterScaleSmoothed) * alpha;
    playerThrusterScaleLastMs = nowMs;
  }
  const thrusterScale = playerThrusterScaleSmoothed;
  // Compensate for cropped SVG viewBox widths so on-screen size remains consistent.
  // Default assumes classic variant cropped to width 12 (from original 48) => 0.25.
  let scaleAdjust = 12 / 48;
  const src = thrusterImg.src;
  if (src.includes("art-deco")) {
    // art-deco cropped to width 18 (from original 48)
    scaleAdjust = 18 / 48;
  }
  const thrusterHalf = (size * thrusterScale * scaleAdjust) / 2;
  const shipHalf = size / 2;
  // Position thruster so its near edge aligns with the back of the ship,
  // independent of any empty padding inside the SVG. This avoids scale
  // pushing the flame further back as the image grows.
  // Pull the thruster further into the ship so it appears closer to the hull
  const embed = size * 0.18;
  const thrusterCX = x + Math.cos(angle) * (-shipHalf - thrusterHalf + embed);
  const thrusterCY = y + Math.sin(angle) * (-shipHalf - thrusterHalf + embed);

  // Add trail point every frame when thrusting
  const now = nowMs;
  // Only begin sampling once thrust is at max visual power
  if (power >= 0.999) {
    // Start trail slightly further back: half a thruster width behind the flame center
    const thrusterWidth = size * thrusterScale * scaleAdjust;
    const sampleBack = thrusterWidth * 0.25;
    const sampleX = thrusterCX - Math.cos(angle) * sampleBack;
    const sampleY = thrusterCY - Math.sin(angle) * sampleBack;
    playerThrusterTrail.push({
      x: sampleX,
      y: sampleY,
      angle,
      timestamp: now,
      power,
      scale: thrusterScale,
    });
    // Keep trail length manageable
    if (playerThrusterTrail.length > TRAIL_MAX_POINTS) {
      playerThrusterTrail.shift();
    }
  }

  // Remove old trail points
  while (
    playerThrusterTrail.length > 0 &&
    now - playerThrusterTrail[0].timestamp > TRAIL_LIFETIME
  ) {
    playerThrusterTrail.shift();
  }

  // Draw trail as interconnected thruster shapes (stamped sprites)
  if (playerThrusterTrail.length > 1) {
    ctx.save();
    // Additive blend for glow overlap
    const prevComposite = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";

    for (let i = playerThrusterTrail.length - 1; i >= 0; i--) {
      const point = playerThrusterTrail[i];
      const ageMs = now - point.timestamp;
      const age = Math.min(1, ageMs / TRAIL_LIFETIME);
      // Faster fade: quadratic falloff and slightly lower cap
      const alpha = Math.max(0, 0.55 * (1 - age) * (1 - age));
      if (alpha <= 0.01) continue;
      const falloff = 0.6 + 0.4 * (1 - age); // taper older stamps
      const stampScale = point.scale * 0.6 * falloff * scaleAdjust;

      // Propel exhaust backward relative to ship facing at emission time.
      // Use a per-point speed that scales with thruster power for visual punch.
      const ageSec = ageMs / 1000;
      const exhaustSpeedPerSec = size * (2.5 + 3.5 * point.power); // px/s
      const drift = exhaustSpeedPerSec * ageSec;
      const driftX = Math.cos(point.angle) * drift;
      const driftY = Math.sin(point.angle) * drift;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(point.x - driftX, point.y - driftY);
      ctx.rotate(point.angle);
      ctx.drawImage(
        thrusterImg,
        (-size / 2) * stampScale,
        (-size / 2) * stampScale,
        size * stampScale,
        size * stampScale,
      );
      ctx.restore();
    }

    ctx.globalCompositeOperation = prevComposite;
    ctx.restore();
  }

  // Draw main thruster at its computed center (aligned to ship's back)
  ctx.save();
  ctx.translate(thrusterCX, thrusterCY);
  ctx.rotate(angle);
  ctx.drawImage(
    thrusterImg,
    (-size / 2) * thrusterScale * scaleAdjust,
    (-size / 2) * thrusterScale * scaleAdjust,
    size * thrusterScale * scaleAdjust,
    size * thrusterScale * scaleAdjust,
  );
  ctx.restore();
}

// No fallback: only draw SVG if loaded

// (Enemy ship SVG uses shared cache via getSpriteByKey)

// Draw a small auxiliary thruster with a color tint (e.g., blue) without trails.
// kind controls position offset relative to the ship: left, right, or front.
export function drawAuxThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  shipAngle: number,
  flameAngle: number,
  size = 24,
  power = 1,
  tint = "#69aaff",
  kind: "left" | "right" | "front" = "left",
): void {
  if (!thrusterImg) {
    const { img } = getSpriteByKey("thruster");
    thrusterImg = img;
  }

  // Base scale larger so aux thrusters are more visible
  const scale = 0.6 + 0.6 * Math.max(0, Math.min(1, power));
  // Match cropping adjustment used by main thruster for consistent sizing
  let scaleAdjust = 12 / 48;
  const src = thrusterImg.src;
  if (src.includes("art-deco")) scaleAdjust = 18 / 48;

  const shipHalf = size / 2;
  const thrHalf = (size * scale * scaleAdjust) / 2;
  const embedFront = size * 0.12;
  const embedSide = size * 0.14;
  const inwardShift = size * 0.15; // move slightly inward toward the hull (~15%)
  const backShift = size * 0.2; // move slightly toward the rear of the ship (~20%) for side thrusters

  // Compute center position for the aux thruster based on kind
  let cx = x;
  let cy = y;
  if (kind === "front") {
    // Place near ship nose with near-edge alignment similar to rear thruster
    const dist = shipHalf + thrHalf - embedFront;
    cx = x + Math.cos(shipAngle) * dist;
    cy = y + Math.sin(shipAngle) * dist;
  } else if (kind === "left") {
    // Left side (Y grows downward): offset along side vector (sin(a), -cos(a))
    const dist = shipHalf + thrHalf - embedSide - inwardShift;
    const ox = Math.sin(shipAngle) * dist;
    const oy = -Math.cos(shipAngle) * dist;
    cx = x + ox;
    cy = y + oy;
  } else if (kind === "right") {
    // Right side (Y grows downward): offset along (-sin(a), cos(a))
    const dist = shipHalf + thrHalf - embedSide - inwardShift;
    const ox = -Math.sin(shipAngle) * dist;
    const oy = Math.cos(shipAngle) * dist;
    cx = x + ox;
    cy = y + oy;
  }

  // Apply a small backward shift only for side thrusters (strafe) to tuck them slightly rearward
  if (kind === "left" || kind === "right") {
    cx -= Math.cos(shipAngle) * backShift;
    cy -= Math.sin(shipAngle) * backShift;
  }

  ctx.save();
  ctx.translate(cx, cy);
  // Rotate to the flame direction (independent of placement basis)
  ctx.rotate(flameAngle);
  // Draw a tinted copy of the thruster using an offscreen mask to avoid tinting the ship
  const dw = size * scale * scaleAdjust;
  const dh = dw;
  if (!auxThrusterTintCanvas) auxThrusterTintCanvas = document.createElement("canvas");
  const canvasTint = auxThrusterTintCanvas;
  if (canvasTint != null) {
    const offCtx = canvasTint.getContext("2d");
    if (offCtx != null) {
      const widthPx = Math.max(1, Math.ceil(dw));
      const heightPx = Math.max(1, Math.ceil(dh));
      if (canvasTint.width !== widthPx || canvasTint.height !== heightPx) {
        canvasTint.width = widthPx;
        canvasTint.height = heightPx;
      }
      offCtx.clearRect(0, 0, widthPx, heightPx);
      offCtx.drawImage(thrusterImg, 0, 0, widthPx, heightPx);
      offCtx.globalCompositeOperation = "source-in";
      offCtx.fillStyle = tint;
      offCtx.fillRect(0, 0, widthPx, heightPx);
      offCtx.globalCompositeOperation = "source-over";
      ctx.drawImage(canvasTint, -widthPx / 2, -heightPx / 2, widthPx, heightPx);
    } else {
      // Fallback: draw untinted image
      ctx.drawImage(
        thrusterImg,
        (-size / 2) * scale * scaleAdjust,
        (-size / 2) * scale * scaleAdjust,
        dw,
        dh,
      );
    }
  } else {
    // Fallback: draw untinted image
    ctx.drawImage(
      thrusterImg,
      (-size / 2) * scale * scaleAdjust,
      (-size / 2) * scale * scaleAdjust,
      dw,
      dh,
    );
  }
  ctx.restore();
}

export function drawEnemyShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
): void {
  const { img } = getSpriteByKey("enemy-ship");
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

// Module-level cache for enemy thruster SVG
let enemyThrusterImg: HTMLImageElement | null = null;

export function drawEnemyThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
  power = 1,
  enemyId = "default",
): void {
  if (!enemyThrusterImg) {
    const { img } = getSpriteByKey("enemy-thruster");
    enemyThrusterImg = img;
    // Image will be ready when needed
  }

  // Initialize trail for this enemy if needed
  if (!enemyThrusterTrails.has(enemyId)) {
    enemyThrusterTrails.set(enemyId, []);
  }
  const trail = enemyThrusterTrails.get(enemyId)!;

  // Add trail point every frame when thrusting
  const now = Date.now();
  if (power > 0.1) {
    // Use the enemy thruster near edge as the cap's near edge
    // Compute thruster center (sprite draw position)
    const offsetX = -size * 1.2;
    const thrusterCX = x + Math.cos(angle) * offsetX;
    const thrusterCY = y + Math.sin(angle) * offsetX;
    // Enemy trail width is fixed below via ctx.lineWidth = size * 0.5
    const capRadius = (size * 0.5) / 2; // half of line width
    const scale = 0.6 + 0.8 * power;
    const thrusterHalf = (size * scale) / 2;
    const nearEdgeX = thrusterCX + Math.cos(angle) * thrusterHalf;
    const nearEdgeY = thrusterCY + Math.sin(angle) * thrusterHalf;
    const trailCX = nearEdgeX - Math.cos(angle) * capRadius;
    const trailCY = nearEdgeY - Math.sin(angle) * capRadius;
    trail.push({ x: trailCX, y: trailCY, angle, timestamp: now, power });
    // Keep trail length manageable
    if (trail.length > TRAIL_MAX_POINTS) {
      trail.shift();
    }
  }

  // Remove old trail points
  while (trail.length > 0 && now - trail[0].timestamp > TRAIL_LIFETIME) {
    trail.shift();
  }

  // Draw trail as gradient path
  if (trail.length > 1) {
    ctx.save();

    // Create gradient along the trail path
    const youngest = trail[trail.length - 1];
    const oldest = trail[0];
    const youngestAgeMs = now - youngest.timestamp;
    const oldestAgeMs = now - oldest.timestamp;
    const youngestAgeSec = youngestAgeMs / 1000;
    const oldestAgeSec = oldestAgeMs / 1000;
    // Enemy exhaust drift speed scales mildly with power; keep it slightly lower than player for readability
    const youngDrift = size * (2.0 + 2.5 * youngest.power) * youngestAgeSec;
    const oldDrift = size * (2.0 + 2.5 * oldest.power) * oldestAgeSec;
    const youngX = youngest.x - Math.cos(youngest.angle) * youngDrift;
    const youngY = youngest.y - Math.sin(youngest.angle) * youngDrift;
    const oldX = oldest.x - Math.cos(oldest.angle) * oldDrift;
    const oldY = oldest.y - Math.sin(oldest.angle) * oldDrift;
    const gradient = ctx.createLinearGradient(youngX, youngY, oldX, oldY);
    gradient.addColorStop(0, "rgba(255, 155, 0, 0.5)"); // Lower starting opacity
    gradient.addColorStop(0.3, "rgba(255, 100, 50, 0.6)"); // Orange-red
    gradient.addColorStop(0.6, "rgba(196, 69, 54, 0.3)"); // Red
    gradient.addColorStop(1, "rgba(255, 155, 0, 0)"); // Transparent at end

    // Draw path with thruster width
    ctx.strokeStyle = gradient;
    ctx.lineWidth = size * 0.5;
    ctx.lineCap = "butt"; // straight edge
    ctx.lineJoin = "round";

    ctx.beginPath();
    for (let i = trail.length - 1; i >= 0; i--) {
      const point = trail[i];
      const ageMs = now - point.timestamp;
      const ageSec = ageMs / 1000;
      const drift = size * (2.0 + 2.5 * point.power) * ageSec;
      const px = point.x - Math.cos(point.angle) * drift;
      const py = point.y - Math.sin(point.angle) * drift;
      if (i === trail.length - 1) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    ctx.restore();
  }

  // Draw main thruster
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  const scale = 0.6 + 0.8 * power;
  const offsetX = -size * 1.2; // Offset behind the ship
  ctx.drawImage(
    enemyThrusterImg,
    offsetX - (size / 2) * scale,
    (-size / 2) * scale,
    size * scale,
    size * scale,
  );
  ctx.restore();
}

// No fallback: only draw SVG if loaded

// Additional sprite-based helpers

type DrawCtx = Pick<
  CanvasRenderingContext2D,
  "save" | "restore" | "translate" | "rotate" | "drawImage"
>;

export function drawProjectile(ctx: DrawCtx, x: number, y: number, angle: number, size = 8): void {
  const { img } = getSpriteByKey("projectile");
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function drawCharacter(ctx: DrawCtx, x: number, y: number, angle: number, size = 32): void {
  const { img } = getSpriteByKey("character");
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export type CreatureSpriteType = "passive" | "neutral" | "hostile";

export function drawCreature(
  ctx: DrawCtx,
  x: number,
  y: number,
  type: CreatureSpriteType,
  size: number,
): void {
  const key =
    type === "passive"
      ? "creature-passive"
      : type === "neutral"
        ? "creature-neutral"
        : "creature-hostile";
  const { img } = getSpriteByKey(key);
  ctx.save();
  ctx.translate(x, y);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export type DroppedItemSpriteType =
  | "tool"
  | "weapon"
  | "material"
  | "consumable"
  | "equipment"
  | "container"
  | "seed"
  | "blueprint"
  | "artifact";

// Cache for individual item icons
const itemIconCache: Map<string, HTMLImageElement> = new Map();

export function drawDroppedItem(
  ctx: DrawCtx,
  x: number,
  y: number,
  item: { type: TemplateId; baseType: DroppedItemSpriteType },
  size = 16,
): void {
  const iconPath = `items/${item.type}.svg`;
  let img = itemIconCache.get(iconPath);

  if (!img) {
    img = new Image();
    img.src = `/lose-game/${iconPath}`;
    itemIconCache.set(iconPath, img);
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export type TerrainSpriteType = "rock" | "vegetation" | "structure";

export function drawTerrain(
  ctx: DrawCtx,
  x: number,
  y: number,
  type: TerrainSpriteType,
  size: number,
): void {
  const key = `terrain-${type}`;
  const { img } = getSpriteByKey(key);
  ctx.save();
  ctx.translate(x, y);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export type ResourceSpriteType = "mineral" | "energy" | "organic";

export function drawResource(
  ctx: DrawCtx,
  x: number,
  y: number,
  type: ResourceSpriteType,
  size = 20,
): void {
  const key = `resource-${type}`;
  const { img } = getSpriteByKey(key);
  ctx.save();
  ctx.translate(x, y);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}
