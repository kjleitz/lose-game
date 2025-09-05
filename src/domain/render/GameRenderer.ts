import type { Action } from "../../application/input/ActionTypes";
import type { Planet } from "../../domain/game/planets";
import type { Biome } from "../../shared/types/Biome";
import type { Circle2D, Kinematics2D, ViewSize } from "../../shared/types/geometry";
import { createSeededRng, hashStringToInt } from "../../shared/utils";
import type { EnemyView as Enemy, PlayerView } from "../game/views";
import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Camera } from "./camera";
import { CameraTransform } from "./CameraTransform";
import { CharacterRenderer } from "./CharacterRenderer";
import { CreatureRenderer } from "./CreatureRenderer";
import { DroppedItemRenderer } from "./DroppedItemRenderer";
import { EnemyRenderer } from "./EnemyRenderer";
import { PlanetRenderer } from "./PlanetRenderer";
import { PlanetSurfaceRenderer } from "./PlanetSurfaceRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { drawProjectile } from "./sprites";
import { StarfieldRenderer } from "./StarfieldRenderer";
import { getVisualConfig } from "./VisualConfig";
import { StarRenderer, type StarView } from "./StarRenderer";

// Legacy modes removed from renderer path; rely on session getters only

interface MinimalGameSession {
  getCurrentModeType?: (this: MinimalGameSession) => "space" | "planet";
  getPlanetSurface?: () => PlanetSurface | undefined;
  getProjectiles?: () => Array<Circle2D>;
  getDroppedItems?: () => DroppedItem[];
  getEnemies?: () => Enemy[];
  getPlayer?: () => PlayerView | null;
  // Planet-mode ship state (optional)
  isInPlanetShip?: () => boolean;
  getInPlanetShipProgress?: () => number;
  // Optional: richer projectile info for space lasers
  getProjectilesDetailed?: () => Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
    faction?: "player" | "enemy" | "neutral";
  }>;
  // Optional: stars in space mode for rendering
  getStars?: () => StarView[];
  // Optional: star heat overlay (when too close to a star in space mode)
  getStarHeatOverlay?: () => { angle: number; intensity: number } | null;
  // Optional: renderer FX events (e.g., enemy burn-up)
  getAndClearRenderFxEvents?: () => Array<{ type: "burn"; x: number; y: number }>;
}

export class GameRenderer {
  // Track short trails for space projectiles (by entity id)
  private spaceProjectileTrails: Map<number, Array<{ x: number; y: number; t: number }>> =
    new Map();
  // Transient burn-up FX (renderer-managed lifetimes)
  private burnFx: Array<{ x: number; y: number; age: number; duration: number }> = [];
  private lastRenderAtMs: number | null = null;

  // Compute heat overlay for a point relative to the nearest star.
  private computeStarHeatFor(
    x: number,
    y: number,
    stars: StarView[] | null | undefined,
  ): { angle: number; intensity: number } | null {
    if (!stars || stars.length === 0) return null;
    let nearest: { dx: number; dy: number; dist: number; radius: number } | null = null;
    for (const star of stars) {
      const dx = star.x - x;
      const dy = star.y - y;
      const dist = Math.hypot(dx, dy);
      if (!nearest || dist < nearest.dist) nearest = { dx, dy, dist, radius: star.radius };
    }
    if (!nearest) return null;
    const distance = nearest.dist;
    const starRadius = nearest.radius;
    const heatOuter = starRadius * 1.25;
    const surface = starRadius;
    if (distance > heatOuter) return null;
    const awayAngle = Math.atan2(-nearest.dy, -nearest.dx);
    const span = Math.max(0.0001, heatOuter - surface);
    const intensity = Math.max(0, Math.min(1, (heatOuter - distance) / span));
    return { angle: awayAngle, intensity };
  }

  // Draw streaming micro-flames around a center, flowing away from star.
  private drawStarHeatTrails(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    streamAngle: number,
    intensity: number,
    cameraZoom: number,
  ): void {
    const renderIntensity = Math.max(0, Math.min(1, intensity));
    const directionX = Math.cos(streamAngle);
    const directionY = Math.sin(streamAngle);

    // Particle-like streaks count/length scale with intensity
    const baseCount = 6;
    const extraCount = 22;
    const streakCount = Math.floor(baseCount + extraCount * renderIntensity);
    const baseLength = 34;
    const length = baseLength * (0.7 + 2.0 * renderIntensity);
    // Tighter cluster: about one third the previous radius
    const spawnRadius = (20 * (0.8 + 1.4 * renderIntensity)) / 3;
    const lineWidth = (1.5 + 2.0 * renderIntensity) / Math.max(0.0001, cameraZoom);
    const nowMs = Date.now();

    ctx.save();
    const previous = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < streakCount; i++) {
      // Deterministic jitter per frame and index
      const seed = (nowMs * 0.001 + i * 12.345) % 1;
      const randA = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      const randB = Math.sin(seed * 93.989 + i * 19.19) * 127.531;
      const rand0to1A = randA - Math.floor(randA); // 0..1
      const rand0to1B = randB - Math.floor(randB); // 0..1

      // Spawn head point uniformly inside a circle centered on the entity
      const theta = rand0to1A * Math.PI * 2;
      const radius = Math.sqrt(rand0to1B) * spawnRadius; // sqrt for uniform disc
      const headX = centerX + Math.cos(theta) * radius;
      const headY = centerY + Math.sin(theta) * radius;
      const fraction = 0.55 + 0.45 * rand0to1A; // 0.55..1.0 length variance
      // Trails stream away from the star: extend in +dir (away)
      const tailX = headX + directionX * length * fraction;
      const tailY = headY + directionY * length * fraction;

      // Gradient from bright white at head to warm yellow at tail with fade
      const gradient = ctx.createLinearGradient(headX, headY, tailX, tailY);
      const headAlpha = 0.28 + 0.52 * renderIntensity;
      const tailAlpha = 0.06 + 0.24 * renderIntensity;
      gradient.addColorStop(0, `rgba(255,255,255,${headAlpha.toFixed(3)})`);
      gradient.addColorStop(1, `rgba(255,210,60,${tailAlpha.toFixed(3)})`);
      ctx.strokeStyle = gradient;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // Small head glow dot for extra punch
      ctx.save();
      ctx.fillStyle = `rgba(255,255,255,${(headAlpha * 0.8).toFixed(3)})`;
      const headSize = (1.4 + 2.2 * renderIntensity) / Math.max(0.0001, cameraZoom);
      ctx.beginPath();
      ctx.arc(headX, headY, headSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.globalCompositeOperation = previous;
    ctx.restore();
  }

  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    planets: Planet[],
    projectiles: Array<Circle2D>,
    enemies: Enemy[],
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    gameSession?: MinimalGameSession | null,
  ): void {
    // Timekeeping for FX
    const nowMs = Date.now();
    const dt = this.lastRenderAtMs ? Math.max(0, (nowMs - this.lastRenderAtMs) / 1000) : 0;
    this.lastRenderAtMs = nowMs;

    // Determine current game mode (avoid unbound method call)
    let currentMode: "space" | "planet" = "space";
    if (gameSession && typeof gameSession.getCurrentModeType === "function") {
      currentMode = gameSession.getCurrentModeType();
    }

    // Clear screen
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    if (currentMode === "space") {
      this.renderSpaceMode(
        ctx,
        player,
        camera,
        planets,
        projectiles,
        enemies,
        actions,
        size,
        dpr,
        gameSession,
      );
    } else if (currentMode === "planet") {
      this.renderPlanetMode(ctx, player, camera, actions, size, dpr, gameSession);
    }

    // FX layer hook for later (particles, etc.)
    // Update lifetimes for burn FX
    if (dt > 0) {
      this.burnFx.forEach((fx) => (fx.age += dt));
      this.burnFx = this.burnFx.filter((fx) => fx.age < fx.duration);
    }
  }

  private renderSpaceMode(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    planets: Planet[],
    projectiles: Array<Circle2D>,
    enemies: Enemy[],
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    gameSession?: MinimalGameSession | null,
  ): void {
    // Black space background
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Starfield layers
    const starfieldRenderer = new StarfieldRenderer();
    const layers = [
      { p: 0.4, opts: { starsPerCell: 10, minSize: 0.6, maxSize: 2 } },
      { p: 0.8, opts: { starsPerCell: 6, minSize: 0.4, maxSize: 1.2 } },
    ];
    for (const layer of layers) {
      const camLayer = { x: camera.x * layer.p, y: camera.y * layer.p, zoom: camera.zoom };
      const [m11L, m12L, m21L, m22L, dxL, dyL] = CameraTransform.getTransform(
        camLayer,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(m11L, m12L, m21L, m22L, dxL, dyL);
      starfieldRenderer.render(ctx, camLayer, size.width, size.height, layer.opts);
    }

    // World entities
    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);

    // Draw stars (solar centers) behind planets if provided
    if (gameSession && typeof gameSession.getStars === "function") {
      const starRenderer = new StarRenderer();
      starRenderer.render(ctx, gameSession.getStars());
    }

    // Draw planets
    const planetRenderer = new PlanetRenderer();
    planetRenderer.render(ctx, planets, (planet) => planet.radius);

    // Draw enemies beneath ship/projectiles
    const enemyRenderer = new EnemyRenderer();
    enemyRenderer.render(ctx, enemies);

    // Draw ship and thruster
    const shipRenderer = new ShipRenderer();
    shipRenderer.render(ctx, player, actions, 48);

    // Consume any new render FX events from session (non-audio) and add to local list
    if (gameSession && typeof gameSession.getAndClearRenderFxEvents === "function") {
      const events = gameSession.getAndClearRenderFxEvents();
      for (const ev of events) {
        if (ev.type === "burn") this.burnFx.push({ x: ev.x, y: ev.y, age: 0, duration: 0.6 });
      }
    }

    // Draw burn-up FX above enemies but below star overlay
    if (this.burnFx.length > 0) {
      for (const fx of this.burnFx) {
        const progress = Math.max(0, Math.min(1, fx.age / fx.duration));
        // Radius grows and fades
        const radius = 10 + 60 * progress;
        const alphaOuter = 0.3 * (1 - progress);
        const alphaInner = 0.6 * (1 - progress * 0.8);
        // Outer glow
        ctx.save();
        const grad = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, radius);
        grad.addColorStop(0, `rgba(255,240,120,${alphaInner.toFixed(3)})`);
        grad.addColorStop(1, `rgba(255,120,0,${alphaOuter.toFixed(3)})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        // Spark streaks
        ctx.save();
        ctx.globalAlpha = 0.5 * (1 - progress);
        ctx.strokeStyle = "#ffd36b";
        ctx.lineWidth = 1.2 / Math.max(0.0001, camera.zoom);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const len = radius * (0.5 + 0.6 * Math.sin(progress * Math.PI + i));
          const x2 = fx.x + Math.cos(angle) * len;
          const y2 = fx.y + Math.sin(angle) * len;
          ctx.beginPath();
          ctx.moveTo(fx.x, fx.y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    // Star heat overlay (space hazard): render streaming micro-flames away from the star
    if (gameSession && typeof gameSession.getStarHeatOverlay === "function") {
      const heat = gameSession.getStarHeatOverlay();
      if (heat && heat.intensity > 0.001) {
        this.drawStarHeatTrails(ctx, player.x, player.y, heat.angle, heat.intensity, camera.zoom);
      }
    }

    // Enemy heat trails (same visual as player when within star heat radius)
    if (gameSession && typeof gameSession.getStars === "function") {
      const stars = gameSession.getStars();
      if (stars && stars.length > 0) {
        for (const enemy of enemies) {
          const overlay = this.computeStarHeatFor(enemy.x, enemy.y, stars);
          if (overlay && overlay.intensity > 0.001) {
            this.drawStarHeatTrails(
              ctx,
              enemy.x,
              enemy.y,
              overlay.angle,
              overlay.intensity,
              camera.zoom,
            );
          }
        }
      }
    }

    // Draw projectiles as bright red lasers with a short trail in space
    const now = Date.now();
    const detailed =
      gameSession && typeof gameSession.getProjectilesDetailed === "function"
        ? gameSession.getProjectilesDetailed()
        : null;

    if (detailed && detailed.length > 0) {
      const TRAIL_MS = 140;
      for (const proj of detailed) {
        // Update trail buffer
        let trail = this.spaceProjectileTrails.get(proj.id);
        if (!trail) {
          trail = [];
          this.spaceProjectileTrails.set(proj.id, trail);
        }
        trail.push({ x: proj.x, y: proj.y, t: now });
        // Prune old points
        while (trail.length > 0 && now - trail[0].t > TRAIL_MS) trail.shift();

        // Draw trail as a fading line behind projectile
        if (trail.length > 1) {
          ctx.save();
          const start = trail[trail.length - 1];
          const end = trail[0];
          const grad = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          grad.addColorStop(0, "rgba(255, 80, 80, 0.9)");
          grad.addColorStop(1, "rgba(255, 0, 0, 0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = Math.max(3, proj.radius * 2);
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let i = trail.length - 1; i >= 0; i--) {
            const tp = trail[i];
            if (i === trail.length - 1) ctx.moveTo(tp.x, tp.y);
            else ctx.lineTo(tp.x, tp.y);
          }
          ctx.stroke();
          ctx.restore();
        }

        // Laser core: short oriented capsule in direction of motion, colored by faction
        const speed = Math.hypot(proj.vx, proj.vy) || 1;
        const dirX = proj.vx / speed;
        const dirY = proj.vy / speed;
        const coreLen = 18; // short laser segment
        const tailX = proj.x - dirX * coreLen;
        const tailY = proj.y - dirY * coreLen;
        ctx.save();
        // Slight additive look
        const prevOp = ctx.globalCompositeOperation;
        ctx.globalCompositeOperation = "lighter";
        const color =
          proj.faction === "player" ? "#ffcf3b" : proj.faction === "enemy" ? "#ff3b3b" : "#ffffff";
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(3, proj.radius * 2.2);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(proj.x, proj.y);
        ctx.stroke();
        ctx.globalCompositeOperation = prevOp;
        ctx.restore();
      }
      // Remove trails for projectiles no longer present
      const liveIds = new Set(detailed.map((proj) => proj.id));
      for (const key of this.spaceProjectileTrails.keys()) {
        if (!liveIds.has(key)) this.spaceProjectileTrails.delete(key);
      }
    } else {
      // Fallback: draw bigger red dots if we don't have velocity/id
      for (const proj of projectiles) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#ff5555";
        const sizePx = Math.max(8, proj.radius * 3);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, sizePx * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Player hit flash overlay (space) drawn last to ensure visibility
    if (gameSession && typeof gameSession.getPlayer === "function") {
      // Ensure world transform is active before overlay
      const [wm11, wm12, wm21, wm22, wdx, wdy] = CameraTransform.getTransform(
        camera,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(wm11, wm12, wm21, wm22, wdx, wdy);
      const pv = gameSession.getPlayer();
      const hit = pv?.hitFlash;
      if (hit) {
        const alpha = Math.max(0, 0.9 * (1 - hit.progress));
        if (alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#ffe97a";
          // Keep stroke thickness consistent on screen regardless of zoom
          ctx.lineWidth = 6 / Math.max(0.0001, camera.zoom);
          ctx.beginPath();
          const cx = pv?.x ?? player.x;
          const cy = pv?.y ?? player.y;
          ctx.arc(cx, cy, 36, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  private renderPlanetMode(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    gameSession?: MinimalGameSession | null,
  ): void {
    // Ask session for surface (ECS path)
    let surface: PlanetSurface | undefined = undefined;
    if (gameSession && typeof gameSession.getPlanetSurface === "function")
      surface = gameSession.getPlanetSurface();

    // Planet surface background
    const planetSurfaceRenderer = new PlanetSurfaceRenderer();

    // Set up world transform for planet surface
    const [m11P, m12P, m21P, m22P, dxP, dyP] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11P, m12P, m21P, m22P, dxP, dyP);

    // Render planet surface (must be provided by mode or session)
    // Hide the landed ship sprite when the player is currently flying it
    const inPlanetShip = Boolean(
      gameSession &&
        typeof gameSession.isInPlanetShip === "function" &&
        gameSession.isInPlanetShip(),
    );
    planetSurfaceRenderer.render(ctx, surface, { showLandedShip: !inPlanetShip });

    // Beneath-water parallax (archipelago-only), subtle and below entities
    if (surface && surface.biome === "archipelago") {
      this.renderUnderwaterParallax(ctx, camera, size, dpr);
      // Restore world transform after parallax layer
      ctx.setTransform(m11P, m12P, m21P, m22P, dxP, dyP);
    }

    // Death effects omitted in ECS path for now

    // Draw dropped items (behind characters but above death effects)
    const droppedItemRenderer = new DroppedItemRenderer();
    if (gameSession && typeof gameSession.getDroppedItems === "function") {
      const items = gameSession.getDroppedItems();
      if (Array.isArray(items) && items.length > 0) {
        droppedItemRenderer.render(ctx, items);
      }
    }

    // Draw character/ship and enemies
    const characterRenderer = new CharacterRenderer();
    const creatureRenderer = new CreatureRenderer();
    if (gameSession && typeof gameSession.getEnemies === "function") {
      const enemies = gameSession.getEnemies();
      creatureRenderer.render(ctx, enemies);
    }
    if (inPlanetShip) {
      // Draw a soft shadow under the ship (consistent southward offset)
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      // Elliptical shadow smaller than the ship
      const shipSize = 56;
      // If session exposes an animation progress, use it for a takeoff feel
      let progress = 1;
      if (gameSession && typeof gameSession.getInPlanetShipProgress === "function") {
        progress = gameSession.getInPlanetShipProgress();
      }
      const clamped = Math.max(0, Math.min(1, progress));
      // Make shadow slightly smaller as the ship "lifts"
      const heightFactor = Math.max(0.55, 0.92 - 0.32 * clamped);
      const shadowWidth = shipSize * 0.62 * heightFactor;
      const shadowHeight = shipSize * 0.24 * heightFactor;
      // Consistent offset: about 1x the rendered ship width, southward (positive Y)
      const sizeBoost = 1 + 0.4 * clamped;
      const renderSize = shipSize * sizeBoost;
      const offsetX = player.x;
      const offsetY = player.y + renderSize * 0.5;
      ctx.save();
      ctx.translate(offsetX, offsetY);
      // Keep ellipse orientation tied to ship angle for readability
      ctx.rotate(player.angle);
      ctx.ellipse(0, 0, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
      ctx.restore();

      // Draw the ship sprite with thruster feedback
      const shipRenderer = new ShipRenderer();
      // Enlarge ship more on planet to sell the lift-off perspective
      shipRenderer.render(ctx, player, actions, shipSize * sizeBoost);
    } else {
      characterRenderer.render(ctx, player, actions, 32);
    }

    // Above-ground parallax: clouds and birds
    if (surface) {
      const biome: Biome = surface.biome ?? "fields";
      this.renderSkyParallax(ctx, camera, size, dpr, biome, surface.planetId);
      // Restore world transform before rendering world-anchored elements again
      ctx.setTransform(m11P, m12P, m21P, m22P, dxP, dyP);
    }

    // Draw projectiles provided by session (ECS path)
    if (gameSession && typeof gameSession.getProjectiles === "function") {
      // ECS path: render projectiles provided by session
      const sessionProjectiles = gameSession.getProjectiles();
      if (Array.isArray(sessionProjectiles) && sessionProjectiles.length > 0) {
        for (const projectile of sessionProjectiles) {
          // Improve visibility: render with a minimum on-screen size and a soft glow
          const drawSize = Math.max(8, projectile.radius * 3);
          // Soft halo behind the projectile for readability
          ctx.save();
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = "#ffff66";
          ctx.beginPath();
          ctx.arc(projectile.x, projectile.y, drawSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          drawProjectile(ctx, projectile.x, projectile.y, 0, drawSize);
        }
      }
    }

    // Player hit flash overlay (planet) drawn after projectiles to ensure visibility
    if (gameSession && typeof gameSession.getPlayer === "function") {
      // Ensure world transform is active before overlay
      const [wm11, wm12, wm21, wm22, wdx, wdy] = CameraTransform.getTransform(
        camera,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(wm11, wm12, wm21, wm22, wdx, wdy);
      const pv = gameSession.getPlayer();
      const hit = pv?.hitFlash;
      if (hit) {
        const alpha = Math.max(0, 0.9 * (1 - hit.progress));
        if (alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#ffe97a";
          // Keep stroke thickness consistent on screen regardless of zoom
          ctx.lineWidth = 5 / Math.max(0.0001, camera.zoom);
          ctx.beginPath();
          const cx = pv?.x ?? player.x;
          const cy = pv?.y ?? player.y;
          ctx.arc(cx, cy, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  private renderUnderwaterParallax(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const factor = 0.7;
    const camL = { x: camera.x * factor, y: camera.y * factor, zoom: camera.zoom };
    const [m11U, m12U, m21U, m22U, dxU, dyU] = CameraTransform.getTransform(
      camL,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11U, m12U, m21U, m22U, dxU, dyU);

    const widthPx = size.width;
    const heightPx = size.height;
    const timeSec = Date.now() * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 6; i++) {
      const y = (i + 1) * (heightPx / 8) + Math.sin(timeSec + i) * 10;
      ctx.fillRect(-widthPx, y, widthPx * 3, 8);
    }
    ctx.restore();
  }

  private renderSkyParallax(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
    biome: Biome,
    planetId: string,
  ): void {
    const factor = 0.6;
    const camL = { x: camera.x * factor, y: camera.y * factor, zoom: camera.zoom };
    const [m11S, m12S, m21S, m22S, dxS, dyS] = CameraTransform.getTransform(
      camL,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11S, m12S, m21S, m22S, dxS, dyS);

    const widthPx = size.width;
    const heightPx = size.height;
    const seed = hashStringToInt(planetId);
    const rng = createSeededRng(seed);

    // Clouds: soft ellipses
    ctx.save();
    ctx.globalAlpha = biome === "desert" ? 0.15 : 0.22;
    ctx.fillStyle = "#ffffff";
    const cfg = getVisualConfig();
    const baseClouds = biome === "rainforest" ? 10 : 6;
    const cloudCount = Math.max(0, Math.floor(baseClouds * cfg.cloudDensity));
    const timeMs = Date.now() * 0.0003;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = (rng.int(0, widthPx) + i * 123) % (widthPx * 2);
      const baseY = (rng.int(0, Math.floor(heightPx / 2)) + i * 47) % Math.floor(heightPx * 0.6);
      const drift = (timeMs * (20 + (i % 5))) % (widthPx * 2);
      const x = -widthPx + baseX + drift;
      const y = baseY * 0.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 80, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + 40, y + 5, 50, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x - 35, y + 8, 45, 18, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Birds: small chevrons drifting
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    const baseFlocks = biome === "rainforest" || biome === "fields" ? 3 : 1;
    const birdFlocks = Math.max(0, Math.floor(baseFlocks * cfg.birdDensity));
    for (let i = 0; i < birdFlocks; i++) {
      const baseX = (rng.int(0, widthPx) + i * 177) % (widthPx * 2);
      const baseY = (rng.int(0, Math.floor(heightPx / 2)) + i * 59) % Math.floor(heightPx * 0.5);
      const drift = (timeMs * 120 + i * 60) % (widthPx * 2);
      const x = -widthPx + baseX + drift;
      const y = 40 + baseY * 0.6;
      for (let bI = 0; bI < 5; bI++) {
        const bx = x + bI * 16;
        const by = y + Math.sin(timeMs * 8 + bI) * 3;
        ctx.beginPath();
        ctx.moveTo(bx - 4, by);
        ctx.lineTo(bx, by + 3);
        ctx.lineTo(bx + 4, by);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
}
