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
  shipImg = null;
  shipImgLoaded = false;
  thrusterImg = null;
  enemyShipImg = null;
  enemyShipImgLoaded = false;
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
  if (variant) return resolveSpriteUrl(key, variant) ?? `/__missing_sprite__/${key}/${variant}.svg`;
  return spritePath(key);
}

// Module-level cache for the SVG image and loaded state (legacy helpers)
let shipImg: HTMLImageElement | null = null;
let shipImgLoaded = false;

export function drawShipTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
): void {
  if (!shipImg) {
    const { img, loaded } = getSpriteByKey("ship");
    shipImg = img;
    shipImgLoaded = loaded;
    shipImg.onload = (): void => {
      shipImgLoaded = true;
    };
  }
  if (shipImgLoaded && shipImg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(shipImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  // No fallback: only draw SVG if loaded
}

// Module-level cache for the thruster SVG image
let thrusterImg: HTMLImageElement | null = null;

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
const TRAIL_LIFETIME = 400; // milliseconds
const TRAIL_MAX_POINTS = 40; // Maximum trail points to keep

export function drawThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
  power = 1,
): void {
  if (!thrusterImg) {
    const { img } = getSpriteByKey("thruster");
    thrusterImg = img;
    // Image will be ready when needed
  }

  // Calculate actual thruster scale (matches main thruster rendering)
  const thrusterScale = 0.8 + 1.2 * power;

  // Add trail point every frame when thrusting
  const now = Date.now();
  // Only begin sampling once thrust is at max visual power
  if (power >= 0.999) {
    // Sample a bit further back behind the ship than before
    // Small offset along the negative facing direction
    const baseOffset = size * 0.35; // teeny bit further back
    const sampleX = x - Math.cos(angle) * baseOffset;
    const sampleY = y - Math.sin(angle) * baseOffset;
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
      const age = Math.min(1, (now - point.timestamp) / TRAIL_LIFETIME);
      const alpha = Math.max(0, 0.6 * (1 - age));
      if (alpha <= 0.01) continue;
      const falloff = 0.6 + 0.4 * (1 - age); // taper older stamps
      const stampScale = point.scale * 0.6 * falloff;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(point.x, point.y);
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

  // Draw main thruster at the original ship center
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(
    thrusterImg,
    (-size / 2) * thrusterScale,
    (-size / 2) * thrusterScale,
    size * thrusterScale,
    size * thrusterScale,
  );
  ctx.restore();
}

// No fallback: only draw SVG if loaded

// Module-level cache for enemy ship SVG
let enemyShipImg: HTMLImageElement | null = null;
let enemyShipImgLoaded = false;

export function drawEnemyShip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
): void {
  if (!enemyShipImg) {
    const { img, loaded } = getSpriteByKey("enemy-ship");
    enemyShipImg = img;
    enemyShipImgLoaded = loaded;
    enemyShipImg.onload = (): void => {
      enemyShipImgLoaded = true;
    };
  }
  if (enemyShipImgLoaded && enemyShipImg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(enemyShipImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  // No fallback: only draw SVG if loaded
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
    const firstPoint = trail[trail.length - 1];
    const lastPoint = trail[0];
    const gradient = ctx.createLinearGradient(firstPoint.x, firstPoint.y, lastPoint.x, lastPoint.y);
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
      if (i === trail.length - 1) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
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
  const { img, loaded } = getSpriteByKey("projectile");
  if (!loaded) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}

export function drawCharacter(ctx: DrawCtx, x: number, y: number, angle: number, size = 32): void {
  const { img, loaded } = getSpriteByKey("character");
  if (!loaded) return;
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
  const { img, loaded } = getSpriteByKey(key);
  if (!loaded) return;
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

export function drawDroppedItem(
  ctx: DrawCtx,
  x: number,
  y: number,
  baseType: DroppedItemSpriteType,
  size = 16,
): void {
  const key = `item-${baseType}`;
  const { img, loaded } = getSpriteByKey(key);
  if (!loaded) return;
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
  const { img, loaded } = getSpriteByKey(key);
  if (!loaded) return;
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
  const { img, loaded } = getSpriteByKey(key);
  if (!loaded) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.drawImage(img, -size / 2, -size / 2, size, size);
  ctx.restore();
}
