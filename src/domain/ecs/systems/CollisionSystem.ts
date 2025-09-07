import type { System, World } from "../../../lib/ecs";
import { defineSystem, Entity as ECSEntity } from "../../../lib/ecs";
import {
  Collider,
  Damage,
  LootDropTable,
  DroppedItem,
  Enemy,
  Health,
  Player,
  Position,
  Projectile,
} from "../components";
import { Faction, HitFlash, ImpactEvent } from "../components";
import type { DropEntry, DropTable as DropTableType } from "../../game/damage/DamageableEntity";
import type { Item } from "../../game/items/Item";
import { ItemFactory } from "../../game/items/ItemFactory";

export function createCollisionSystem(world: World): System {
  // Create item factory for proper item creation
  const itemFactory = new ItemFactory();

  // Create separate systems for different collision types
  const projectileEntities = world.query({
    position: Position,
    collider: Collider,
    projectile: Projectile,
    damage: Damage,
  });
  const playerEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    player: Player,
  });
  const enemyEntities = world.query({
    position: Position,
    collider: Collider,
    health: Health,
    enemy: Enemy,
  });

  const targets = [...playerEntities, ...enemyEntities];

  // Loot quantity multiplier is read when rolling drops via PlayerModifiers.

  // Check projectile vs target collisions
  projectileEntities.forEach((projectile) => {
    const { position: projPos, collider: projCollider, damage: projDamage } = projectile.components;
    const projFaction =
      new ECSEntity(projectile.entity, world).getComponent(Faction)?.team ?? "neutral";

    targets.forEach((target) => {
      if (projectile.entity === target.entity) return; // Can't hit self

      const {
        position: targetPos,
        collider: targetCollider,
        health: targetHealth,
      } = target.components;
      const targetFaction =
        new ECSEntity(target.entity, world).getComponent(Faction)?.team ?? "neutral";
      // Prevent friendly fire: skip if same faction
      if (projFaction === targetFaction) return;
      const dx = projPos.x - targetPos.x;
      const dy = projPos.y - targetPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const combinedRadius = projCollider.radius + targetCollider.radius;

      if (distance < combinedRadius) {
        // Hit!
        targetHealth.current -= projDamage.amount;
        // Hit flash on target
        const flashDur = 0.12;
        world.addComponentToEntity(
          target.entity,
          HitFlash,
          HitFlash.create({ remaining: flashDur, duration: flashDur }),
        );
        // Emit an impact event entity for SFX systems
        // Tag as a player-hit when the target is the player, so audio can be unique
        const targetIsPlayer = world.hasComponent(target.entity, Player);
        world
          .createEntity()
          .addComponent(Position, { x: targetPos.x, y: targetPos.y })
          .addComponent(ImpactEvent, { kind: targetIsPlayer ? "player" : "generic" });

        if (targetHealth.current <= 0) {
          // Spawn drops if entity has a drop table
          if (world.hasComponent(target.entity, LootDropTable)) {
            const ent = new ECSEntity(target.entity, world);
            const dt = ent.getComponent(LootDropTable);
            const drops = dt
              ? rollDrops(dt, getLootQuantityMult(world, playerEntities), itemFactory)
              : [];
            for (const drop of drops) {
              const offsetX = (Math.random() - 0.5) * 20;
              const offsetY = (Math.random() - 0.5) * 20;
              world
                .createEntity()
                .addComponent(Position, { x: targetPos.x + offsetX, y: targetPos.y + offsetY })
                .addComponent(DroppedItem, {
                  item: drop.item,
                  quantity: drop.quantity,
                  ageSeconds: 0,
                });
            }
          }
          world.removeEntity(target.entity);
        }

        // Remove projectile on hit
        world.removeEntity(projectile.entity);
      }
    });
  });

  // Return a no-op system since we executed immediately
  return defineSystem(world)
    .withComponents({})
    .execute((): void => {});
}

function rollDrops(
  dropTable: DropTableType,
  quantityMult = 1,
  itemFactory: ItemFactory,
): Array<{ item: Item; quantity: number }> {
  const drops: Array<{ item: Item; quantity: number }> = [];
  const consider = (entry: DropEntry): void => {
    if (!entry.itemTemplateId) return;
    if (Math.random() < entry.probability) {
      const qty =
        Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity;
      const item = itemFactory.createItem(entry.itemTemplateId);
      const scaledQty = Math.max(1, Math.floor(qty * quantityMult));
      if (item != null && scaledQty > 0) drops.push({ item, quantity: scaledQty });
    }
  };
  for (const entry of dropTable.guaranteed ?? []) consider(entry);
  for (const entry of dropTable.possible ?? []) consider(entry);
  for (const entry of dropTable.rare ?? []) consider(entry);
  return drops;
}

// Helper to read PlayerModifiers. Imported here to avoid circular deps, we define a local accessor.
import { PlayerModifiers } from "../components";
function getLootQuantityMult(
  world: World,
  players: Array<ReturnType<World["query"]>[number]>,
): number {
  if (players.length === 0) return 1;
  const pid = players[0].entity;
  const ent = new ECSEntity(pid, world);
  const mods = ent.getComponent(PlayerModifiers);
  return mods ? mods.lootQuantityMult : 1;
}
