import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D, ViewSize } from "../../shared/types/geometry";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Camera } from "./camera";
import type { RenderSession } from "./RenderSession";
import { CameraTransform } from "./CameraTransform";
import { CharacterRenderer } from "./CharacterRenderer";
import { CreatureRenderer } from "./CreatureRenderer";
import { DroppedItemRenderer } from "./DroppedItemRenderer";
import { PlanetSurfaceRenderer } from "./PlanetSurfaceRenderer";
import { drawProjectile } from "./sprites";
import type { Biome } from "../../shared/types/Biome";
import { ShipRenderer } from "./ShipRenderer";

type SessionLike = RenderSession;

export class PlanetModeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    session: SessionLike,
  ): void {
    const surface = this.getPlanetSurfaceFromSession(session);
    const inPlanetShip = this.isInPlanetShip(session);

    this.renderPlanetSurfaceLayer(ctx, session, camera, size, dpr, !inPlanetShip);
    this.renderPlanetDroppedItems(ctx, session);
    this.renderPlanetEntities(ctx, session, player, actions, inPlanetShip);
    this.renderPlanetSkyParallax(ctx, surface, camera, size, dpr);
    this.renderPlanetProjectiles(ctx, session, camera, size, dpr);
    this.renderPlayerHitFlashPlanet(ctx, session, player, camera, size, dpr);
  }

  private getPlanetSurfaceFromSession(session: SessionLike): PlanetSurface | undefined {
    if (typeof session.getPlanetSurface !== "function") return undefined;
    return session.getPlanetSurface();
  }

  private isInPlanetShip(session: SessionLike): boolean {
    return Boolean(typeof session.isInPlanetShip === "function" && session.isInPlanetShip());
  }

  private renderPlanetSurfaceLayer(
    ctx: CanvasRenderingContext2D,
    session: SessionLike,
    camera: Camera,
    size: ViewSize,
    dpr: number,
    showLandedShip: boolean,
  ): void {
    const surface = this.getPlanetSurfaceFromSession(session);
    const planetSurfaceRenderer = new PlanetSurfaceRenderer();
    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);
    planetSurfaceRenderer.render(ctx, surface, { showLandedShip });
    if (surface && surface.biome === "archipelago") {
      this.renderUnderwaterParallax(ctx, camera, size, dpr);
      ctx.setTransform(m11, m12, m21, m22, dx, dy);
    }
  }

  private renderPlanetDroppedItems(ctx: CanvasRenderingContext2D, session: SessionLike): void {
    const items = session.getDroppedItems ? session.getDroppedItems() : [];
    if (!Array.isArray(items) || items.length === 0) return;
    const renderer = new DroppedItemRenderer();
    renderer.render(ctx, items);
  }

  private renderPlanetEntities(
    ctx: CanvasRenderingContext2D,
    session: SessionLike,
    player: Kinematics2D,
    actions: Set<Action>,
    inPlanetShip: boolean,
  ): void {
    const creatureRenderer = new CreatureRenderer();
    const enemies = session.getEnemies();
    creatureRenderer.render(ctx, enemies);
    if (inPlanetShip) {
      this.renderPlanetShipShadow(ctx, player);
      const progress =
        typeof session.getInPlanetShipProgress === "function"
          ? session.getInPlanetShipProgress()
          : 1;
      const clamped = Math.max(0, Math.min(1, progress));
      const baseShipSize = 56;
      const sizeBoost = 1 + 0.4 * clamped;
      const ship = new ShipRenderer();
      const pv = session.getPlayer ? session.getPlayer() : null;
      const perks = pv?.perks ?? {};
      ship.render(ctx, player, actions, baseShipSize * sizeBoost, perks);
    } else {
      const characterRenderer = new CharacterRenderer();
      characterRenderer.render(ctx, player, actions, 32);
    }
  }

  private renderPlanetShipShadow(ctx: CanvasRenderingContext2D, player: Kinematics2D): void {
    const shipSize = 56;
    const progress = 1;
    const clamped = Math.max(0, Math.min(1, progress));
    const heightFactor = Math.max(0.55, 0.92 - 0.32 * clamped);
    const shadowWidth = shipSize * 0.62 * heightFactor;
    const shadowHeight = shipSize * 0.24 * heightFactor;
    const sizeBoost = 1 + 0.4 * clamped;
    const renderSize = shipSize * sizeBoost;
    const offsetX = player.x;
    const offsetY = player.y + renderSize * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.rotate(player.angle);
    ctx.ellipse(0, 0, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
    ctx.restore();
  }

  private renderPlanetSkyParallax(
    ctx: CanvasRenderingContext2D,
    surface: PlanetSurface | undefined,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    if (!surface) return;
    const biome: Biome = surface.biome ?? "fields";
    this.renderSkyParallax(ctx, camera, size, dpr, biome, surface.planetId);
  }

  private renderPlanetProjectiles(
    ctx: CanvasRenderingContext2D,
    session: SessionLike,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const list = session.getProjectiles();
    if (!Array.isArray(list) || list.length === 0) return;
    // Ensure world transform before drawing projectiles
    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);
    for (const projectile of list) {
      const drawSize = Math.max(8, projectile.radius * 3);
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

  private renderPlayerHitFlashPlanet(
    ctx: CanvasRenderingContext2D,
    session: SessionLike,
    player: Kinematics2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
  ): void {
    const [wm11, wm12, wm21, wm22, wdx, wdy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(wm11, wm12, wm21, wm22, wdx, wdy);
    const pv = session.getPlayer();
    const hit = pv?.hitFlash;
    if (!hit) return;
    const alpha = Math.max(0, 0.9 * (1 - hit.progress));
    if (alpha <= 0.02) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#ffe97a";
    ctx.lineWidth = 5 / Math.max(0.0001, camera.zoom);
    ctx.beginPath();
    const cx = pv?.x ?? player.x;
    const cy = pv?.y ?? player.y;
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Parallax helpers copied to keep this class self-contained
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
      const y = (i + 1) * (heightPx / 8) + Math.sin(timeSec + i) * 2;
      ctx.fillRect(-widthPx, y, widthPx * 3, 4);
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
    const seed = this.hashStringToInt(planetId);
    const rng = this.createSeededRng(seed);

    // Clouds
    ctx.save();
    ctx.globalAlpha = biome === "desert" ? 0.15 : 0.22;
    ctx.fillStyle = "#ffffff";
    const baseClouds = biome === "rainforest" ? 10 : 6;
    const cloudCount = Math.max(0, Math.floor(baseClouds * 1));
    const timeMs = Date.now() * 0.0003;
    for (let i = 0; i < cloudCount; i++) {
      const baseX = (rng.int(0, widthPx) + i * 123) % (widthPx * 2);
      const baseY = (rng.int(0, Math.floor(heightPx / 2)) + i * 47) % Math.floor(heightPx * 0.6);
      const drift = (timeMs * (20 + (i % 5))) % (widthPx * 2);
      const x = -widthPx + baseX + drift;
      const y = (baseY * 0.5) | 0;
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

    // Birds
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#222";
    ctx.lineWidth = 1;
    const baseFlocks = biome === "rainforest" || biome === "fields" ? 3 : 1;
    const birdFlocks = Math.max(0, Math.floor(baseFlocks * 1));
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

  // Deterministic RNG helpers
  private hashStringToInt(text: string): number {
    let hash = 2166136261 >>> 0;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  private createSeededRng(seed: number): { int(min: number, max: number): number } {
    let state = seed >>> 0;
    return {
      int(min: number, max: number): number {
        state += 0x6d2b79f5;
        let rnd = Math.imul(state ^ (state >>> 15), 1 | state);
        rnd ^= rnd + Math.imul(rnd ^ (rnd >>> 7), 61 | rnd);
        rnd = (rnd ^ (rnd >>> 14)) >>> 0;
        const out = rnd / 4294967296;
        return Math.floor(out * (max - min + 1)) + min;
      },
    };
  }
}
