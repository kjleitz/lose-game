import type { Action } from "../../../application/input/ActionTypes";
import { TIME } from "../../../config/time";
import type { System, World } from "../../../lib/ecs";
import { defineSystem, Entity } from "../../../lib/ecs";
import type { Item } from "../../game/items/Item";
import { DroppedItem, Player, Position, Velocity, PlayerExperience } from "../components";

export interface PickupEvent {
  item: Item;
  quantity: number;
  autoUsed?: boolean;
}

export function createDroppedItemAgingSystem(world: World, dt: number): System {
  const DESPAWN = TIME.DROPPED_ITEM_DESPAWN_SEC;
  return defineSystem(world)
    .withComponents({ dropped: DroppedItem })
    .execute((entities): void => {
      entities.forEach(({ components, entity }) => {
        const { dropped } = components;
        dropped.ageSeconds += dt;
        if (dropped.ageSeconds > DESPAWN) {
          world.removeEntity(entity);
        }
      });
    });
}

export function createPickupSystem(
  world: World,
  _actions: Set<Action>,
  onPickedUp: (ev: PickupEvent) => void,
  range = 40,
  onAttractStrength?: (strength: number) => void,
): System {
  // Attraction mechanics
  const ATTRACTION_RADIUS = 140; // pixels; beyond pickup range, items are pulled toward player
  const MAX_PULL_SPEED = 260; // px/s when very close within attraction radius
  return defineSystem(world)
    .withComponents({ position: Position, dropped: DroppedItem })
    .execute((drops): void => {
      // Proximity-based pickup: no keypress required
      const players = world.query({ position: Position, player: Player });
      if (players.length === 0) return;
      const playerPos = players[0].components.position;
      let maxStrength = 0;

      drops.forEach(({ components, entity }) => {
        const { position, dropped } = components;
        const dx = playerPos.x - position.x;
        const dy = playerPos.y - position.y;
        const dist = Math.hypot(dx, dy);

        // If within pickup radius, collect immediately
        if (dist <= range) {
          // Auto-use certain items on pickup (e.g., XP orbs or flagged items)
          let autoUsed = false;
          // Emit a final strong attraction cue so autoused items still wwomp
          if (onAttractStrength) onAttractStrength(1);
          if (
            dropped.item.type === "xp_pack_small" ||
            dropped.item.metadata.autoUseOnPickup === true
          ) {
            const xpEntities = world.query({ player: Player, experience: PlayerExperience });
            if (xpEntities.length > 0) {
              const exp = xpEntities[0].components.experience;
              exp.current += dropped.quantity;
              autoUsed = true;
            }
          }
          onPickedUp({ item: dropped.item, quantity: dropped.quantity, autoUsed });
          world.removeEntity(entity);
          return;
        }

        // If within attraction radius, pull item toward player by setting velocity
        if (dist <= ATTRACTION_RADIUS) {
          const nx = dx / (dist || 1); // normalized direction x
          const ny = dy / (dist || 1); // normalized direction y
          // Speed increases as item gets closer (0 at edge -> MAX near player)
          const proximityFactor = Math.max(0, Math.min(1, 1 - dist / ATTRACTION_RADIUS));
          if (proximityFactor > maxStrength) maxStrength = proximityFactor;
          const speed = MAX_PULL_SPEED * proximityFactor;
          const vx = nx * speed;
          const vy = ny * speed;
          if (world.hasComponent(entity, Velocity)) {
            const ent = new Entity(entity, world);
            const velocityComp = ent.getComponent(Velocity);
            if (velocityComp) {
              velocityComp.dx = vx;
              velocityComp.dy = vy;
            }
          } else {
            world.addComponentToEntity(entity, Velocity, Velocity.create({ dx: vx, dy: vy }));
          }
        }
      });
      if (onAttractStrength && maxStrength > 0) onAttractStrength(maxStrength);
    });
}
