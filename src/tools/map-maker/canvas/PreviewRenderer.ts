import type { MapProject } from "../types/MapProject";
import type { EditingTool } from "../types/EditingTools";
import type { Wall, Door, InteractiveStation } from "../../../domain/game/ship-interior/types";
import type { TerrainFeature, Resource } from "../../../domain/game/planet-surface/types";

export class PreviewRenderer {
  // Throttling is handled by the engine/canvas loop

  public render(
    context: CanvasRenderingContext2D,
    project: MapProject,
    camera: { x: number; y: number; zoom: number },
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    // No internal throttling; the canvas loop schedules frames

    // Calculate visible bounds for culling
    const viewportBounds = this.calculateViewportBounds(camera, canvasWidth, canvasHeight);
    context.save();

    // Set up transformation matrix for camera
    context.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
    context.scale(camera.zoom, camera.zoom);

    if (project.type === "ship" && project.ship) {
      this.renderShipInterior(context, project.ship, viewportBounds);
    } else if (project.type === "planet" && project.planet) {
      this.renderPlanetSurface(context, project.planet, viewportBounds);
    }

    context.restore();
  }

  public renderToolPreview(
    context: CanvasRenderingContext2D,
    tool: EditingTool,
    camera: { x: number; y: number; zoom: number },
    previewData?: Wall | null,
  ): void {
    // Tool preview rendering would be implemented based on specific tool types
    // This is a placeholder for the preview system
    context.save();
    context.translate(-camera.x * camera.zoom, -camera.y * camera.zoom);
    context.scale(camera.zoom, camera.zoom);

    // Render tool-specific preview based on tool.id
    switch (tool.id) {
      case "wall":
        this.renderWallPreview(context, previewData);
        break;
      case "door":
        this.renderDoorPreview(context);
        break;
      case "station":
        this.renderStationPreview(context);
        break;
      default:
        break;
    }

    context.restore();
  }

  private renderShipInterior(
    context: CanvasRenderingContext2D,
    ship: MapProject["ship"],
    viewportBounds: { x: number; y: number; width: number; height: number },
  ): void {
    if (!ship) return;

    const state = ship.layerState ?? {
      structure: { visible: true, locked: false, opacity: 1, order: 0 },
      objects: { visible: true, locked: false, opacity: 1, order: 1 },
      rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
      lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
    };
    type ShipLayerId = "structure" | "rooms" | "objects" | "lighting";
    const shipOrder: Record<ShipLayerId, number> = {
      structure: state.structure.order,
      rooms: state.rooms.order,
      objects: state.objects.order,
      lighting: state.lighting.order,
    };
    const shipLayerIds: ShipLayerId[] = ["structure", "rooms", "objects", "lighting"];
    const layers: Array<{ id: ShipLayerId; opacity: number; visible: boolean }> = shipLayerIds
      .map((id) => {
        switch (id) {
          case "structure":
            return { id, opacity: state.structure.opacity, visible: state.structure.visible };
          case "rooms":
            return { id, opacity: state.rooms.opacity, visible: state.rooms.visible };
          case "objects":
            return { id, opacity: state.objects.opacity, visible: state.objects.visible };
          case "lighting":
            return { id, opacity: state.lighting.opacity, visible: state.lighting.visible };
        }
      })
      .sort((left, right) => shipOrder[left.id] - shipOrder[right.id]);

    for (const layer of layers) {
      if (!layer.visible) continue;
      context.save();
      context.globalAlpha *= layer.opacity;
      switch (layer.id) {
        case "structure": {
          context.strokeStyle = "#666666";
          context.lineWidth = 4;
          ship.walls.forEach((wall) => {
            if (this.isWallInViewport(wall, viewportBounds)) {
              this.renderWall(context, wall);
            }
          });
          break;
        }
        case "objects": {
          context.fillStyle = "#8b4513";
          ship.doors.forEach((door) => {
            if (
              this.isInViewport(door.x, door.y, Math.max(door.width, door.height), viewportBounds)
            ) {
              this.renderDoor(context, door);
            }
          });
          context.fillStyle = "#4169e1";
          ship.stations.forEach((station) => {
            if (this.isInViewport(station.x, station.y, station.radius, viewportBounds)) {
              this.renderStation(context, station);
            }
          });
          break;
        }
        case "rooms": {
          context.strokeStyle = "#ffff00";
          context.lineWidth = 2;
          context.setLineDash([5, 5]);
          ship.rooms.forEach((room) => {
            if (this.isRoomInViewport(room, viewportBounds)) {
              this.renderRoomOutline(context, room);
            }
          });
          context.setLineDash([]);
          break;
        }
        case "lighting": {
          // Placeholder for lighting visualization layer
          break;
        }
      }
      context.restore();
    }

    // Player spawn point always visible
    if (
      ship.playerSpawnPoint !== undefined &&
      this.isInViewport(ship.playerSpawnPoint.x, ship.playerSpawnPoint.y, 16, viewportBounds)
    ) {
      this.renderSpawnPoint(context, ship.playerSpawnPoint);
    }
  }

  private renderPlanetSurface(
    context: CanvasRenderingContext2D,
    planet: MapProject["planet"],
    viewportBounds: { x: number; y: number; width: number; height: number },
  ): void {
    if (!planet) return;

    const state = planet.layerState ?? {
      terrain: { visible: true, locked: false, opacity: 1, order: 0 },
      biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
      resources: { visible: true, locked: false, opacity: 1, order: 2 },
      decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
    };
    type PlanetLayerId = "terrain" | "resources" | "biomes" | "decorations";
    const planetOrder: Record<PlanetLayerId, number> = {
      terrain: state.terrain.order,
      resources: state.resources.order,
      biomes: state.biomes.order,
      decorations: state.decorations.order,
    };
    const planetLayerIds: PlanetLayerId[] = ["terrain", "resources", "biomes", "decorations"];
    const layers: Array<{ id: PlanetLayerId; opacity: number; visible: boolean }> = planetLayerIds
      .map((id) => {
        switch (id) {
          case "terrain":
            return { id, opacity: state.terrain.opacity, visible: state.terrain.visible };
          case "resources":
            return { id, opacity: state.resources.opacity, visible: state.resources.visible };
          case "biomes":
            return { id, opacity: state.biomes.opacity, visible: state.biomes.visible };
          case "decorations":
            return { id, opacity: state.decorations.opacity, visible: state.decorations.visible };
        }
      })
      .sort((left, right) => planetOrder[left.id] - planetOrder[right.id]);

    for (const layer of layers) {
      if (!layer.visible) continue;
      context.save();
      context.globalAlpha *= layer.opacity;
      switch (layer.id) {
        case "terrain": {
          context.fillStyle = "#8b4513";
          planet.terrain.forEach((feature) => {
            if (this.isInViewport(feature.x, feature.y, feature.size, viewportBounds)) {
              this.renderTerrainFeature(context, feature);
            }
          });
          break;
        }
        case "resources": {
          context.fillStyle = "#ffd700";
          planet.resources.forEach((resource) => {
            if (this.isInViewport(resource.x, resource.y, 10, viewportBounds)) {
              this.renderResource(context, resource);
            }
          });
          break;
        }
        case "biomes": {
          // Placeholder for biome painting visualization
          break;
        }
        case "decorations": {
          // Placeholder for decorations
          break;
        }
      }
      context.restore();
    }

    // Creatures and landing site always visible
    context.fillStyle = "#ff6347";
    planet.creatures.forEach((creature) => {
      if (this.isInViewport(creature.x, creature.y, creature.radius, viewportBounds)) {
        this.renderCreature(context, creature);
      }
    });

    if (
      planet.landingSite != null &&
      this.isInViewport(planet.landingSite.x, planet.landingSite.y, 25, viewportBounds)
    ) {
      this.renderLandingSite(context, planet.landingSite);
    }
  }

  private renderWall(context: CanvasRenderingContext2D, wall: Wall): void {
    context.beginPath();
    context.moveTo(wall.x1, wall.y1);
    context.lineTo(wall.x2, wall.y2);
    context.lineWidth = wall.thickness;
    context.stroke();
  }

  private renderDoor(context: CanvasRenderingContext2D, door: Door): void {
    context.save();
    context.translate(door.x, door.y);

    if (door.orientation === "horizontal") {
      context.fillRect(-door.width / 2, -door.height / 2, door.width, door.height);
    } else {
      context.fillRect(-door.height / 2, -door.width / 2, door.height, door.width);
    }

    context.restore();
  }

  private renderStation(context: CanvasRenderingContext2D, station: InteractiveStation): void {
    context.beginPath();
    context.arc(station.x, station.y, station.radius, 0, Math.PI * 2);
    context.fill();

    // Render interaction radius
    context.save();
    context.strokeStyle = "#4169e1";
    context.lineWidth = 1;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(station.x, station.y, station.radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  private renderRoomOutline(
    context: CanvasRenderingContext2D,
    room: { bounds: { x: number; y: number; width: number; height: number } },
  ): void {
    context.strokeRect(room.bounds.x, room.bounds.y, room.bounds.width, room.bounds.height);
  }

  private renderSpawnPoint(
    context: CanvasRenderingContext2D,
    point: { x: number; y: number },
  ): void {
    context.save();
    context.fillStyle = "#00ff00";
    context.beginPath();
    context.arc(point.x, point.y, 8, 0, Math.PI * 2);
    context.fill();

    // Add cross indicator
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(point.x - 6, point.y);
    context.lineTo(point.x + 6, point.y);
    context.moveTo(point.x, point.y - 6);
    context.lineTo(point.x, point.y + 6);
    context.stroke();
    context.restore();
  }

  private renderTerrainFeature(context: CanvasRenderingContext2D, feature: TerrainFeature): void {
    context.save();

    switch (feature.type) {
      case "rock":
        context.fillStyle = "#696969";
        break;
      case "vegetation":
        context.fillStyle = "#228b22";
        break;
      case "structure":
        context.fillStyle = "#cd853f";
        break;
    }

    context.beginPath();
    context.arc(feature.x, feature.y, feature.size, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private renderResource(context: CanvasRenderingContext2D, resource: Resource): void {
    context.save();

    switch (resource.type) {
      case "mineral":
        context.fillStyle = "#b8860b";
        break;
      case "energy":
        context.fillStyle = "#00ffff";
        break;
      case "organic":
        context.fillStyle = "#adff2f";
        break;
    }

    context.beginPath();
    context.arc(resource.x, resource.y, 6, 0, Math.PI * 2);
    context.fill();

    // Add glow effect
    const fillColor = context.fillStyle;
    if (typeof fillColor === "string") {
      context.shadowColor = fillColor;
      context.shadowBlur = 4;
      context.fill();
    }
    context.restore();
  }

  private renderCreature(
    context: CanvasRenderingContext2D,
    creature: { x: number; y: number; radius: number; type: string },
  ): void {
    context.save();

    switch (creature.type) {
      case "passive":
        context.fillStyle = "#32cd32";
        break;
      case "neutral":
        context.fillStyle = "#ffa500";
        break;
      case "hostile":
        context.fillStyle = "#ff4500";
        break;
    }

    context.beginPath();
    context.arc(creature.x, creature.y, creature.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
  }

  private renderLandingSite(
    context: CanvasRenderingContext2D,
    point: { x: number; y: number },
  ): void {
    context.save();
    context.strokeStyle = "#00ff00";
    context.lineWidth = 3;
    context.setLineDash([10, 5]);

    // Render landing pad circle
    context.beginPath();
    context.arc(point.x, point.y, 20, 0, Math.PI * 2);
    context.stroke();

    // Render center point
    context.fillStyle = "#00ff00";
    context.beginPath();
    context.arc(point.x, point.y, 4, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }

  private renderWallPreview(
    context: CanvasRenderingContext2D,
    previewWall: Wall | null | undefined,
  ): void {
    if (!previewWall) return;

    context.save();
    context.strokeStyle = "#ffff00";
    context.lineWidth = previewWall.thickness;
    context.setLineDash([5, 5]);

    // Draw preview line from start to current position
    context.beginPath();
    context.moveTo(previewWall.x1, previewWall.y1);
    context.lineTo(previewWall.x2, previewWall.y2);
    context.stroke();

    context.restore();
  }

  private renderDoorPreview(context: CanvasRenderingContext2D): void {
    // Placeholder for door placement preview
    context.save();
    context.fillStyle = "rgba(139, 69, 19, 0.5)";
    // Would draw door preview at current mouse position
    context.restore();
  }

  private renderStationPreview(context: CanvasRenderingContext2D): void {
    // Placeholder for station placement preview
    context.save();
    context.fillStyle = "rgba(65, 105, 225, 0.5)";
    // Would draw station preview at current mouse position
    context.restore();
  }

  private calculateViewportBounds(
    camera: { x: number; y: number; zoom: number },
    canvasWidth: number,
    canvasHeight: number,
  ): { x: number; y: number; width: number; height: number } {
    const worldWidth = canvasWidth / camera.zoom;
    const worldHeight = canvasHeight / camera.zoom;

    return {
      x: camera.x,
      y: camera.y,
      width: worldWidth,
      height: worldHeight,
    };
  }

  private isInViewport(
    x: number,
    y: number,
    size: number,
    bounds: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      x + size >= bounds.x &&
      x - size <= bounds.x + bounds.width &&
      y + size >= bounds.y &&
      y - size <= bounds.y + bounds.height
    );
  }

  private isWallInViewport(
    wall: Wall,
    bounds: { x: number; y: number; width: number; height: number },
  ): boolean {
    const minX = Math.min(wall.x1, wall.x2) - wall.thickness / 2;
    const maxX = Math.max(wall.x1, wall.x2) + wall.thickness / 2;
    const minY = Math.min(wall.y1, wall.y2) - wall.thickness / 2;
    const maxY = Math.max(wall.y1, wall.y2) + wall.thickness / 2;

    return (
      maxX >= bounds.x &&
      minX <= bounds.x + bounds.width &&
      maxY >= bounds.y &&
      minY <= bounds.y + bounds.height
    );
  }

  private isRoomInViewport(
    room: { bounds: { x: number; y: number; width: number; height: number } },
    viewportBounds: { x: number; y: number; width: number; height: number },
  ): boolean {
    return (
      room.bounds.x + room.bounds.width >= viewportBounds.x &&
      room.bounds.x <= viewportBounds.x + viewportBounds.width &&
      room.bounds.y + room.bounds.height >= viewportBounds.y &&
      room.bounds.y <= viewportBounds.y + viewportBounds.height
    );
  }
}
