import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D, ViewSize } from "../../shared/types/geometry";
import type { ShipInterior } from "../game/ship-interior/types";
import { renderStationGlyph } from "./stationGlyph";
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

    for (const room of shipInterior.rooms) {
      const path = this.buildRoomPath(room);
      const fill = this.getRoomFillColor(room.type);

      ctx.save();
      if (path) {
        ctx.fillStyle = fill;
        ctx.fill(path);
      } else {
        ctx.fillStyle = fill;
        ctx.fillRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
      }
      ctx.restore();

      this.renderFloorPattern(ctx, room, path);
      this.renderRoomLabel(ctx, room);
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

      const rotation =
        typeof door.rotation === "number"
          ? door.rotation
          : door.orientation === "vertical"
            ? Math.PI / 2
            : 0;

      ctx.save();
      ctx.translate(door.x, door.y);
      ctx.rotate(rotation);
      ctx.fillRect(-door.width / 2, -door.height / 2, door.width, door.height);
      ctx.strokeRect(-door.width / 2, -door.height / 2, door.width, door.height);
      ctx.restore();

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
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(station.x, station.y, station.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      renderStationGlyph(ctx, station, { includeLabel: false });
    }

    ctx.restore();
  }

  private renderRoomLighting(ctx: CanvasRenderingContext2D, shipInterior: ShipInterior): void {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.1;

    for (const room of shipInterior.rooms) {
      const { x, y } = this.getRoomLabelPosition(room);
      const radius = Math.max(room.bounds.width, room.bounds.height) / 2;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
      grad.addColorStop(0, room.lighting.color);
      grad.addColorStop(1, "transparent");

      ctx.fillStyle = grad;
      const path = this.buildRoomPath(room);
      if (path) {
        ctx.fill(path);
      } else {
        ctx.fillRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
      }
    }

    ctx.restore();
  }

  private buildRoomPath(room: ShipInterior["rooms"][number]): Path2D | null {
    if (Array.isArray(room.boundary) && room.boundary.length >= 3) {
      const path = new Path2D();
      const [first, ...rest] = room.boundary;
      path.moveTo(first.x, first.y);
      for (const point of rest) {
        path.lineTo(point.x, point.y);
      }
      path.closePath();
      return path;
    }

    const path = new Path2D();
    path.rect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
    return path;
  }

  private getRoomFillColor(type: ShipInterior["rooms"][number]["type"]): string {
    switch (type) {
      case "bridge":
        return "#233b55";
      case "quarters":
        return "#3d2a2f";
      case "cargo":
        return "#2c3f33";
      case "engine":
        return "#4a2f23";
      default:
        return "#2b2f4a";
    }
  }

  private renderFloorPattern(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
    path: Path2D | null,
  ): void {
    if (!room.floorPattern) return;

    ctx.save();
    if (path) {
      ctx.clip(path);
    } else {
      ctx.beginPath();
      ctx.rect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
      ctx.clip();
    }

    switch (room.floorPattern) {
      case "grating":
        this.drawGratingPattern(ctx, room);
        break;
      case "tile":
        this.drawTilePattern(ctx, room);
        break;
      case "carpet":
        this.drawCarpetPattern(ctx, room);
        break;
      case "metal":
      default:
        this.drawMetalPattern(ctx, room);
        break;
    }

    ctx.restore();
  }

  private drawGratingPattern(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
  ): void {
    const step = 18;
    ctx.strokeStyle = "rgba(200, 200, 200, 0.3)";
    ctx.lineWidth = 2;
    for (
      let offset = -room.bounds.height;
      offset < room.bounds.width + room.bounds.height;
      offset += step
    ) {
      ctx.beginPath();
      ctx.moveTo(room.bounds.x + offset, room.bounds.y);
      ctx.lineTo(room.bounds.x + offset + room.bounds.height, room.bounds.y + room.bounds.height);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(40, 40, 40, 0.25)";
    ctx.lineWidth = 1.2;
    for (
      let offset = -room.bounds.height;
      offset < room.bounds.width + room.bounds.height;
      offset += step
    ) {
      ctx.beginPath();
      ctx.moveTo(room.bounds.x + offset + room.bounds.height, room.bounds.y);
      ctx.lineTo(room.bounds.x + offset, room.bounds.y + room.bounds.height);
      ctx.stroke();
    }
  }

  private drawTilePattern(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
  ): void {
    const size = 24;
    ctx.strokeStyle = "rgba(220, 220, 220, 0.25)";
    ctx.lineWidth = 2;
    for (let x = room.bounds.x; x <= room.bounds.x + room.bounds.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, room.bounds.y);
      ctx.lineTo(x, room.bounds.y + room.bounds.height);
      ctx.stroke();
    }
    for (let y = room.bounds.y; y <= room.bounds.y + room.bounds.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(room.bounds.x, y);
      ctx.lineTo(room.bounds.x + room.bounds.width, y);
      ctx.stroke();
    }
  }

  private drawCarpetPattern(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
  ): void {
    const square = 20;
    for (let y = room.bounds.y; y < room.bounds.y + room.bounds.height; y += square) {
      for (let x = room.bounds.x; x < room.bounds.x + room.bounds.width; x += square) {
        const even = ((Math.floor(x / square) + Math.floor(y / square)) & 1) === 0;
        ctx.fillStyle = even ? "rgba(160, 60, 60, 0.35)" : "rgba(110, 35, 35, 0.35)";
        ctx.fillRect(x, y, square, square);
      }
    }
  }

  private drawMetalPattern(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
  ): void {
    for (let y = room.bounds.y; y < room.bounds.y + room.bounds.height; y += 28) {
      for (let x = room.bounds.x; x < room.bounds.x + room.bounds.width; x += 28) {
        ctx.fillStyle = "rgba(220, 220, 220, 0.3)";
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    for (
      let diag = -room.bounds.height;
      diag < room.bounds.width + room.bounds.height;
      diag += 36
    ) {
      ctx.beginPath();
      ctx.moveTo(room.bounds.x + diag, room.bounds.y);
      ctx.lineTo(room.bounds.x + diag + room.bounds.height, room.bounds.y + room.bounds.height);
      ctx.stroke();
    }
  }

  private renderRoomLabel(
    ctx: CanvasRenderingContext2D,
    room: ShipInterior["rooms"][number],
  ): void {
    const label = room.name.trim() === "" ? this.formatRoomName(room.type) : room.name;
    if (label.length === 0) return;

    const { x, y } = this.getRoomLabelPosition(room);

    ctx.save();
    ctx.font = '600 14px "Rajdhani", "Arial", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const metrics = ctx.measureText(label);
    const boxWidth = metrics.width + 16;
    const boxHeight = 22;

    ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
    ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);

    ctx.fillStyle = "#f4f4f4";
    ctx.fillText(label, x, y);

    ctx.restore();
  }

  private getRoomLabelPosition(room: ShipInterior["rooms"][number]): { x: number; y: number } {
    if (Array.isArray(room.boundary) && room.boundary.length >= 3) {
      let area = 0;
      let centroidX = 0;
      let centroidY = 0;
      for (let i = 0; i < room.boundary.length; i++) {
        const current = room.boundary[i];
        const next = room.boundary[(i + 1) % room.boundary.length];
        const cross = current.x * next.y - next.x * current.y;
        area += cross;
        centroidX += (current.x + next.x) * cross;
        centroidY += (current.y + next.y) * cross;
      }
      area *= 0.5;
      if (Math.abs(area) > 0.0001) {
        centroidX /= 6 * area;
        centroidY /= 6 * area;
        return { x: centroidX, y: centroidY };
      }
    }

    return {
      x: room.bounds.x + room.bounds.width / 2,
      y: room.bounds.y + room.bounds.height / 2,
    };
  }

  private formatRoomName(type: ShipInterior["rooms"][number]["type"]): string {
    switch (type) {
      case "bridge":
        return "Bridge";
      case "quarters":
        return "Crew Quarters";
      case "cargo":
        return "Cargo Bay";
      case "engine":
        return "Engine Room";
      case "corridor":
      default:
        return "Corridor";
    }
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
