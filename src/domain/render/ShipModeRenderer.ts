import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D, ViewSize } from "../../shared/types/geometry";
import type { ShipInterior } from "../game/ship-interior/types";
import type { Camera } from "./camera";
import type { RenderSession } from "./RenderSession";
import { CameraTransform } from "./CameraTransform";
import { CharacterRenderer } from "./CharacterRenderer";
import { DroppedItemRenderer } from "./DroppedItemRenderer";

type SessionLike = RenderSession;

export class ShipModeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    camera: Camera,
    actions: Set<Action>,
    size: ViewSize,
    dpr: number,
    session: SessionLike,
  ): void {
    const shipInterior = this.getShipInteriorFromSession(session);

    this.renderShipBackground(ctx, size);
    this.renderShipInterior(ctx, camera, size, dpr, shipInterior);
    this.renderShipDroppedItems(ctx, session);
    this.renderPlayer(ctx, player, actions);
    this.renderPlayerHitFlash(ctx, session, player, camera, size, dpr);
  }

  private getShipInteriorFromSession(session: SessionLike): ShipInterior | undefined {
    if (typeof session.getShipInterior !== "function") return undefined;
    return session.getShipInterior();
  }

  private renderShipBackground(ctx: CanvasRenderingContext2D, size: ViewSize): void {
    // Dark space-like background for ship interior
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, size.width, size.height);
  }

  private renderShipInterior(
    ctx: CanvasRenderingContext2D,
    camera: Camera,
    size: ViewSize,
    dpr: number,
    shipInterior: ShipInterior | undefined,
  ): void {
    if (!shipInterior) return;

    const [m11, m12, m21, m22, dx, dy] = CameraTransform.getTransform(
      camera,
      size.width,
      size.height,
      dpr,
    );
    ctx.setTransform(m11, m12, m21, m22, dx, dy);

    // Render ship floor
    this.renderShipFloors(ctx, shipInterior);

    // Render ship walls
    this.renderShipWalls(ctx, shipInterior);

    // Render doors
    this.renderShipDoors(ctx, shipInterior);

    // Render interactive stations
    this.renderShipStations(ctx, shipInterior);

    // Render room lighting effects
    this.renderRoomLighting(ctx, shipInterior);
  }

  private renderShipFloors(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();

    // Render room floors with different colors based on room type
    for (const room of shipInterior.rooms) {
      let floorColor: string;
      switch (room.type) {
        case "bridge":
          floorColor = "#2a3a4a";
          break;
        case "quarters":
          floorColor = "#3a2a2a";
          break;
        case "cargo":
          floorColor = "#2a3a2a";
          break;
        case "engine":
          floorColor = "#4a2a2a";
          break;
        default:
          floorColor = "#2a2a3a";
      }

      ctx.fillStyle = floorColor;
      ctx.fillRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);

      // Add subtle grid pattern
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.3;

      const gridSize = 20;
      for (let x = room.bounds.x; x < room.bounds.x + room.bounds.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, room.bounds.y);
        ctx.lineTo(x, room.bounds.y + room.bounds.height);
        ctx.stroke();
      }
      for (let y = room.bounds.y; y < room.bounds.y + room.bounds.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(room.bounds.x, y);
        ctx.lineTo(room.bounds.x + room.bounds.width, y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  private renderShipWalls(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();

    for (const wall of shipInterior.walls) {
      let wallColor: string;
      switch (wall.type) {
        case "hull":
          wallColor = "#666";
          break;
        case "reinforced":
          wallColor = "#888";
          break;
        default:
          wallColor = "#555";
      }

      ctx.strokeStyle = wallColor;
      ctx.lineWidth = wall.thickness;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(wall.x1, wall.y1);
      ctx.lineTo(wall.x2, wall.y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderShipDoors(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();

    for (const door of shipInterior.doors) {
      const isOpen = door.isOpen;
      ctx.fillStyle = isOpen ? "#4a4" : "#a44";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;

      if (door.orientation === "horizontal") {
        ctx.fillRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
        ctx.strokeRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
      } else {
        ctx.fillRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
        ctx.strokeRect(door.x - door.width / 2, door.y - door.height / 2, door.width, door.height);
      }

      // Add door indicator
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(isOpen ? "OPEN" : "CLOSED", door.x, door.y + 2);
    }

    ctx.restore();
  }

  private renderShipStations(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();

    for (const station of shipInterior.stations) {
      let stationColor: string;
      switch (station.type) {
        case "pilot_console":
          stationColor = "#4af";
          break;
        case "navigation":
          stationColor = "#4fa";
          break;
        case "cargo_terminal":
          stationColor = "#fa4";
          break;
        case "engine_controls":
          stationColor = "#f44";
          break;
        default:
          stationColor = "#aaa";
      }

      // Draw station base
      ctx.fillStyle = stationColor;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(station.x, station.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // Draw interaction radius (faint)
      ctx.strokeStyle = stationColor;
      ctx.globalAlpha = 0.2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(station.x, station.y, station.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw station label
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#fff";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(station.name, station.x, station.y - 15);
    }

    ctx.restore();
  }

  private renderRoomLighting(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.1;

    for (const room of shipInterior.rooms) {
      const grad = ctx.createRadialGradient(
        room.bounds.x + room.bounds.width / 2,
        room.bounds.y + room.bounds.height / 2,
        0,
        room.bounds.x + room.bounds.width / 2,
        room.bounds.y + room.bounds.height / 2,
        Math.max(room.bounds.width, room.bounds.height) / 2,
      );

      grad.addColorStop(0, room.lighting.color);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      ctx.fillRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
    }

    ctx.restore();
  }

  private renderShipDroppedItems(ctx: CanvasRenderingContext2D, session: SessionLike): void {
    const items = session.getDroppedItems ? session.getDroppedItems() : [];
    if (!Array.isArray(items) || items.length === 0) return;
    const renderer = new DroppedItemRenderer();
    renderer.render(ctx, items);
  }

  private renderPlayer(
    ctx: CanvasRenderingContext2D,
    player: Kinematics2D,
    actions: Set<Action>,
  ): void {
    const characterRenderer = new CharacterRenderer();
    characterRenderer.render(ctx, player, actions, 28);
  }

  private renderPlayerHitFlash(
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
    ctx.lineWidth = 4 / Math.max(0.0001, camera.zoom);
    ctx.beginPath();
    const cx = pv?.x ?? player.x;
    const cy = pv?.y ?? player.y;
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}
