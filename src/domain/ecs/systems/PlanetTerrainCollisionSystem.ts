import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Collider, Player, Position } from "../components";
import type { PlanetSurface } from "../../game/planet-surface/types";

export function createPlanetTerrainCollisionSystem(
  world: World,
  getSurface: () => PlanetSurface | undefined,
  playerRadiusOverride?: number,
): System {
  return defineSystem(world)
    .withComponents({ position: Position, collider: Collider, player: Player })
    .execute((players): void => {
      const surface = getSurface();
      if (!surface) return;
      if (players.length === 0) return;
      const player = players[0];
      const { position, collider } = player.components;
      const playerRadius = playerRadiusOverride ?? collider.radius ?? 16;

      for (const feature of surface.terrain) {
        if (feature.type !== "rock" && feature.type !== "vegetation") continue;
        const dx = position.x - feature.x;
        const dy = position.y - feature.y;
        const dist = Math.hypot(dx, dy);
        const combinedRadius = playerRadius + feature.size;
        if (dist < combinedRadius) {
          // Handle perfect overlap by choosing an arbitrary normal
          const nx = dist > 0 ? dx / dist : 1;
          const ny = dist > 0 ? dy / dist : 0;
          const overlap = combinedRadius - (dist > 0 ? dist : 0);
          position.x += nx * overlap;
          position.y += ny * overlap;
        }
      }
    });
}
