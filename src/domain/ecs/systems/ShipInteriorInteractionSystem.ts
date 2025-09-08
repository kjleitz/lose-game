import type { System, World } from "../../../lib/ecs";
import { defineSystem } from "../../../lib/ecs";
import { Player, Position } from "../components";
import type { ShipInterior, Door, InteractiveStation } from "../../game/ship-interior/types";
import type { Action } from "../../../application/input/ActionTypes";

/**
 * System for handling ship interior interactions (doors, stations)
 */
export function createShipInteriorInteractionSystem(
  world: World,
  getShipInterior: () => ShipInterior | undefined,
  actions: Set<Action>,
  interactCooldown: number,
  onInteract: (type: "door" | "station", target: Door | InteractiveStation) => void,
): System {
  return defineSystem(world)
    .withComponents({ position: Position, player: Player })
    .execute((players): void => {
      const shipInterior = getShipInterior();
      if (!shipInterior || players.length === 0) return;

      const player = players[0];
      const { position } = player.components;

      // Only process interactions if interact key is pressed and not on cooldown
      if (!actions.has("interact") || interactCooldown > 0) return;

      // Check for door interactions
      for (const door of shipInterior.doors) {
        const distance = Math.hypot(position.x - door.x, position.y - door.y);
        const interactionRadius = Math.max(door.width, door.height) / 2 + 20; // Door size + buffer

        if (distance <= interactionRadius) {
          onInteract("door", door);
          return; // Only interact with one thing at a time
        }
      }

      // Check for station interactions
      for (const station of shipInterior.stations) {
        const distance = Math.hypot(position.x - station.x, position.y - station.y);

        if (distance <= station.radius) {
          onInteract("station", station);
          return; // Only interact with one thing at a time
        }
      }
    });
}
