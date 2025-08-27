// Module-level cache for the SVG image and loaded state
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
    shipImg = new window.Image();
    shipImg.src = "/src/assets/svg/ship.svg";
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
    thrusterImg = new window.Image();
    thrusterImg.src = "/src/assets/svg/thruster.svg";
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
      const p = playerThrusterTrail[i];
      const age = Math.min(1, (now - p.timestamp) / TRAIL_LIFETIME);
      const alpha = Math.max(0, 0.6 * (1 - age));
      if (alpha <= 0.01) continue;
      const falloff = 0.6 + 0.4 * (1 - age); // taper older stamps
      const stampScale = p.scale * 0.6 * falloff;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
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
    enemyShipImg = new window.Image();
    enemyShipImg.src = "/src/assets/svg/enemy-ship.svg";
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
    enemyThrusterImg = new window.Image();
    enemyThrusterImg.src = "/src/assets/svg/enemy-thruster.svg";
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
