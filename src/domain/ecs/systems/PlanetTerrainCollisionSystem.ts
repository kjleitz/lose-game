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
      const pr = playerRadiusOverride ?? collider.radius ?? 16;

      for (const t of surface.terrain) {
        if (t.type !== "rock" && t.type !== "vegetation") continue;
        const dx = position.x - t.x;
        const dy = position.y - t.y;
        const dist = Math.hypot(dx, dy);
        const r = pr + t.size;
        if (dist < r) {
          // Handle perfect overlap by choosing an arbitrary normal
          const nx = dist > 0 ? dx / dist : 1;
          const ny = dist > 0 ? dy / dist : 0;
          const overlap = r - (dist > 0 ? dist : 0);
          position.x += nx * overlap;
          position.y += ny * overlap;
        }
      }
    });
}
