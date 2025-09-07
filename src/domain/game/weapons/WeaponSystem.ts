import { DamageType } from "../damage/DamageableEntity";
import type {
  DamageableEntity,
  DamageEvent,
  DamageType as DamageTypeT,
} from "../damage/DamageableEntity";
import type { Item } from "../items/Item";
import { BaseItemType, ItemQuality, ItemRarity } from "../items/Item";
import type { Player } from "../player";

// Weapon properties are read from item.properties with runtime fallbacks

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  damageType: DamageType;
  range: number;
  distanceTraveled: number;
  sourcePlayerId: string;
  weaponType: string;
}

export interface WeaponFireResult {
  success: boolean;
  projectile?: Projectile;
  reason?: string;
  ammoUsed?: number;
}

export class WeaponSystem {
  private projectiles: Map<string, Projectile> = new Map();
  private nextProjectileId = 1;

  fireWeapon(player: Player, weapon: Item, targetX: number, targetY: number): WeaponFireResult {
    // Validate weapon
    if (!this.isWeapon(weapon)) {
      return { success: false, reason: "Not a weapon" };
    }

    const weaponProps = weapon.properties;

    // Check durability
    if (weapon.properties.durability && weapon.properties.durability.currentDurability <= 0) {
      return { success: false, reason: "Weapon broken" };
    }

    // Calculate direction and projectile velocity
    const dx = targetX - player.state.x;
    const dy = targetY - player.state.y;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      return { success: false, reason: "Invalid target" };
    }

    const speed = this.getWeaponProjectileSpeed(weaponProps);
    const vx = (dx / distance) * speed;
    const vy = (dy / distance) * speed;

    // Create projectile
    const projectile: Projectile = {
      id: `projectile_${this.nextProjectileId++}`,
      x: player.state.x,
      y: player.state.y,
      vx,
      vy,
      damage: this.getWeaponDamage(weaponProps),
      damageType: this.getWeaponDamageType(weaponProps),
      range: this.getWeaponRange(weaponProps),
      distanceTraveled: 0,
      sourcePlayerId: "player", // Assuming single player for now
      weaponType: weapon.type,
    };

    this.projectiles.set(projectile.id, projectile);

    // Reduce weapon durability
    this.damageWeapon(weapon, 1);

    return {
      success: true,
      projectile,
      ammoUsed: 1, // Simple for now, could be enhanced for different ammo types
    };
  }

  update(dt: number, entities: DamageableEntity[]): void {
    for (const [id, projectile] of this.projectiles) {
      // Update projectile position
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;

      const frameDistance = Math.hypot(projectile.vx * dt, projectile.vy * dt);
      projectile.distanceTraveled += frameDistance;

      // Check if projectile exceeded range
      if (projectile.distanceTraveled >= projectile.range) {
        this.projectiles.delete(id);
        continue;
      }

      // Check for collisions with entities
      let hit = false;
      for (const entity of entities) {
        const distance = Math.hypot(
          projectile.x - entity.position.x,
          projectile.y - entity.position.y,
        );
        const hitRadius = 15; // Basic hit radius, could be based on entity size

        if (distance <= hitRadius) {
          // Hit the entity
          const damageEvent: DamageEvent = {
            amount: projectile.damage,
            type: projectile.damageType,
            source: {
              entityId: projectile.sourcePlayerId,
              sourceType: "player",
              weaponType: projectile.weaponType,
            },
            position: { x: projectile.x, y: projectile.y },
            direction: { x: projectile.vx, y: projectile.vy },
            critical: Math.random() < 0.1, // 10% crit chance
          };

          entity.takeDamage(damageEvent);
          hit = true;
          break;
        }
      }

      if (hit) {
        this.projectiles.delete(id);
      }
    }
  }

  getAllProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values());
  }

  private isWeapon(item: Item): boolean {
    return item.baseType === BaseItemType.WEAPON;
  }

  private damageWeapon(weapon: Item, damage: number): void {
    if (weapon.properties.durability) {
      weapon.properties.durability.currentDurability = Math.max(
        0,
        weapon.properties.durability.currentDurability - damage,
      );
    }
  }

  // Get equipped weapon from player (placeholder - would integrate with inventory)
  getEquippedWeapon(_player: Player): Item | null {
    // This would normally check player's equipped items or active inventory slot
    // For now, we'll create a basic weapon
    return this.createBasicWeapon();
  }

  private createBasicWeapon(): Item {
    return {
      id: "basic_blaster",
      type: "plasma_pistol",
      baseType: BaseItemType.WEAPON,
      name: "Basic Plasma Pistol",
      description: "A simple energy weapon for planetary exploration",
      properties: {
        weight: 1.5,
        volume: 2,
        stackable: false,
        maxStackSize: 1,
        durability: {
          maxDurability: 100,
          currentDurability: 100,
          repairability: { canRepair: false, requiredMaterials: [], repairCost: 0 },
          degradationRate: 1,
        },
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: false,
        damage: 25,
        damageType: "energy",
        range: 400,
        projectileSpeed: 800,
        fireRate: 2.0, // shots per second
        energyCost: 5,
      },
      stats: {
        value: 150,
      },
      requirements: {},
      effects: [],
      metadata: { discoveredAt: Date.now(), icon: "/items/gun_pistol.svg", category: "weapons" },
      implemented: false,
    };
  }

  private getWeaponDamage(props: Item["properties"]): number {
    return typeof props.damage === "number" ? props.damage : 20;
  }

  private getWeaponRange(props: Item["properties"]): number {
    return typeof props.range === "number" ? props.range : 500;
  }

  private getWeaponProjectileSpeed(props: Item["properties"]): number {
    return typeof props.projectileSpeed === "number" ? props.projectileSpeed : 600;
  }

  private getWeaponDamageType(props: Item["properties"]): DamageTypeT {
    const dt = props.damageType;
    return dt ?? DamageType.PHYSICAL;
  }

  // No longer needed: toolType check replaced by baseType check
}
