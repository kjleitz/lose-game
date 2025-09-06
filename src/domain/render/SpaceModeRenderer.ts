import type { Action } from "../../application/input/ActionTypes";
import type { Planet } from "../game/planets";
import type { Circle2D, Kinematics2D, ViewSize } from "../../shared/types/geometry";
import { CameraTransform } from "./CameraTransform";
import { EnemyRenderer } from "./EnemyRenderer";
import type { EnemyView as Enemy } from "../game/views";
import { PlanetRenderer } from "./PlanetRenderer";
import { ShipRenderer } from "./ShipRenderer";
import { StarfieldRenderer } from "./StarfieldRenderer";
import { StarRenderer } from "./StarRenderer";
import { drawProjectile } from "./sprites";
import type { Camera } from "./camera";
import type { RenderSession } from "./RenderSession";

type SessionLike = RenderSession;

export class SpaceModeRenderer {
  private spaceProjectileTrails: Map<number, Array<{ x: number; y: number; t: number }>> =
    new Map();
  private burnFx: Array<{ x: number; y: number; age: number; duration: number }> = [];
  private lastRenderAtMs: number | null = null;

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
    session: SessionLike,
  ): void {
    // FX timing
    const nowMs = Date.now();
    const dt = this.lastRenderAtMs ? Math.max(0, (nowMs - this.lastRenderAtMs) / 1000) : 0;
    this.lastRenderAtMs = nowMs;

    // Background and parallax
    this.renderSpaceBackground(ctx);
    this.renderStarfield(ctx, camera, size, dpr);

    // World transform and world-anchored elements
    this.applyWorldTransform(ctx, camera, size, dpr);
    this.renderStars(ctx, session);
    this.renderPlanets(ctx, planets);
    this.renderEnemies(ctx, enemies);
    // Gather player perks for auxiliary thruster rendering
    const pv = session.getPlayer?.();
    const perks = pv?.perks ?? {};
    this.renderShipSprite(ctx, player, actions, 48, perks);

    // Player heat trails
    const heat = session.getPlayerStarHeatOverlay ? session.getPlayerStarHeatOverlay() : null;
    if (heat && heat.intensity > 0.001) {
      this.drawStarHeatTrails(ctx, player.x, player.y, heat.angle, heat.intensity, camera.zoom);
    }

    // Enemy heat trails from session (parity with player)
    const overlays = session.getEnemyStarHeatOverlays();
    if (overlays && overlays.length > 0) {
      const byId = new Map(overlays.map((overlay) => [overlay.id, overlay]));
      for (const enemy of enemies) {
        const ov = byId.get(enemy.id);
        if (ov && ov.intensity > 0.001) {
          this.drawStarHeatTrails(ctx, enemy.x, enemy.y, ov.angle, ov.intensity, camera.zoom);
        }
      }
    }

    // Session visual FX (e.g., burn-up flares)
    if (session.getAndClearRenderFxEvents) {
      const events = session.getAndClearRenderFxEvents();
      for (const ev of events)
        if (ev.type === "burn") this.burnFx.push({ x: ev.x, y: ev.y, age: 0, duration: 0.6 });
    }

    // Draw burn-up FX above enemies but below star overlay
    if (this.burnFx.length > 0) {
      for (const fx of this.burnFx) {
        const progress = Math.max(0, Math.min(1, fx.age / fx.duration));
        const radius = 10 + 60 * progress;
        const alphaOuter = 0.3 * (1 - progress);
        const alphaInner = 0.6 * (1 - progress * 0.8);
        ctx.save();
        const grad = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, radius);
        grad.addColorStop(0, `rgba(255,240,120,${alphaInner.toFixed(3)})`);
        grad.addColorStop(1, `rgba(255,120,0,${alphaOuter.toFixed(3)})`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Projectiles
    this.renderSpaceProjectiles(ctx, projectiles, session);

    // Player hit flash overlay (space)
    if (session && typeof session.getPlayer === "function") {
      const pv = session.getPlayer();
      const hit = pv?.hitFlash;
      if (hit) {
        const alpha = Math.max(0, 0.9 * (1 - hit.progress));
        if (alpha > 0.02) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = "#ffe97a";
          ctx.lineWidth = 6 / Math.max(0.0001, camera.zoom);
          ctx.beginPath();
          ctx.arc(pv?.x ?? player.x, pv?.y ?? player.y, 36, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    // Update and draw burn FX
    if (dt > 0) {
      this.burnFx.forEach((fx) => (fx.age += dt));
      this.burnFx = this.burnFx.filter((fx) => fx.age < fx.duration);
    }
  }

  private renderSpaceBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  private renderStarfield(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const starfieldRenderer = new StarfieldRenderer();
    const layers = [
      { parallax: 0.4, opts: { starsPerCell: 10, minSize: 0.6, maxSize: 2 } },
      { parallax: 0.8, opts: { starsPerCell: 6, minSize: 0.4, maxSize: 1.2 } },
    ];
    for (const layer of layers) {
      const camLayer = {
        x: camera.x * layer.parallax,
        y: camera.y * layer.parallax,
        zoom: camera.zoom,
      };
      const [m11L, m12L, m21L, m22L, dxL, dyL] = CameraTransform.getTransform(
        camLayer,
        size.width,
        size.height,
        dpr,
      );
      ctx.setTransform(m11L, m12L, m21L, m22L, dxL, dyL);
      starfieldRenderer.render(ctx, camLayer, size.width, size.height, layer.opts);
    }
  }

  private applyWorldTransform(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);
  }

  private renderStars(ctx: CanvasRenderingContext2D, session: SessionLike): void {
    const starRenderer = new StarRenderer();
    starRenderer.render(ctx, session.getStars());
  }

  private renderPlanets(ctx: CanvasRenderingContext2D, planets: Planet[]): void {
    const planetRenderer = new PlanetRenderer();
    planetRenderer.render(ctx, planets, (planet) => planet.radius);
  }

  private renderEnemies(ctx: CanvasRenderingContext2D, enemies: Enemy[]): void {
    const enemyRenderer = new EnemyRenderer();
    enemyRenderer.render(ctx, enemies);
  }

  private renderShipSprite(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    actions: Set<Action>,
    sizePx: number,
    perks: Record<string, number>,
  ): void {
    const shipRenderer = new ShipRenderer();
    shipRenderer.render(ctx, player, actions, sizePx, perks);
  }

  private renderSpaceProjectiles(
    ctx: CanvasRenderingContext2D,
    projectiles: Array<Circle2D>,
    session: SessionLike,
  ): void {
    const now = Date.now();
    const detailed =
      typeof session.getProjectilesDetailed === "function"
        ? session.getProjectilesDetailed()
        : null;
    if (detailed && detailed.length > 0) {
      const TRAIL_MS = 140;
      for (const proj of detailed) {
        let trail = this.spaceProjectileTrails.get(proj.id);
        if (!trail) {
          trail = [];
          this.spaceProjectileTrails.set(proj.id, trail);
        }
        trail.push({ x: proj.x, y: proj.y, t: now });
        while (trail.length > 0 && now - trail[0].t > TRAIL_MS) trail.shift();

        if (trail.length > 1) {
          ctx.save();
          const start = trail[trail.length - 1];
          const end = trail[0];
          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          gradient.addColorStop(0, "rgba(255, 80, 80, 0.9)");
          gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
          ctx.strokeStyle = gradient;
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

        // Laser core oriented by velocity
        const speed = Math.hypot(proj.vx, proj.vy) || 1;
        const dirX = proj.vx / speed;
        const dirY = proj.vy / speed;
        const coreLen = 18;
        const tailX = proj.x - dirX * coreLen;
        const tailY = proj.y - dirY * coreLen;
        ctx.save();
        const previousOp = ctx.globalCompositeOperation;
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
        ctx.globalCompositeOperation = previousOp;
        ctx.restore();
      }
      const liveIds = new Set(detailed.map((proj) => proj.id));
      for (const key of this.spaceProjectileTrails.keys()) {
        if (!liveIds.has(key)) this.spaceProjectileTrails.delete(key);
      }
    } else {
      for (const proj of projectiles) {
        const drawSize = Math.max(8, proj.radius * 3);
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#ff5555";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, drawSize * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        drawProjectile(ctx, proj.x, proj.y, 0, drawSize);
      }
    }
  }

  // (No local heat computation needed; session provides overlays.)

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

    const baseCount = 6;
    const extraCount = 22;
    const streakCount = Math.floor(baseCount + extraCount * renderIntensity);
    const baseLength = 34;
    const length = baseLength * (0.7 + 2.0 * renderIntensity);
    const spawnRadius = (20 * (0.8 + 1.4 * renderIntensity)) / 3;
    const lineWidth = (1.5 + 2.0 * renderIntensity) / Math.max(0.0001, cameraZoom);
    const nowMs = Date.now();

    ctx.save();
    const previous = ctx.globalCompositeOperation;
    ctx.globalCompositeOperation = "lighter";

    for (let i = 0; i < streakCount; i++) {
      const seed = (nowMs * 0.001 + i * 12.345) % 1;
      const randA = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
      const randB = Math.sin(seed * 93.989 + i * 19.19) * 127.531;
      const rand0to1A = randA - Math.floor(randA);
      const rand0to1B = randB - Math.floor(randB);
      const theta = rand0to1A * Math.PI * 2;
      const radius = Math.sqrt(rand0to1B) * spawnRadius;
      const headX = centerX + Math.cos(theta) * radius;
      const headY = centerY + Math.sin(theta) * radius;
      const fraction = 0.55 + 0.45 * rand0to1A;
      const tailX = headX + directionX * length * fraction;
      const tailY = headY + directionY * length * fraction;
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
}
