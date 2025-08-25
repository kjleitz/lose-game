import type {
  DamageableEntity,
  DamageEvent,
  DamageResult,
  DropEntry,
  DropModifier,
} from "./DamageableEntity";

export class DamageSystem {
  processDamage(target: DamageableEntity, damage: DamageEvent): DamageResult {
    return target.takeDamage(damage);
  }

  private calculateKnockback(
    target: DamageableEntity,
    damage: DamageEvent,
  ): { x: number; y: number } {
    // Calculate knockback based on damage amount and direction
    const baseKnockback = damage.amount * 0.5;
    return {
      x: damage.direction.x * baseKnockback,
      y: damage.direction.y * baseKnockback,
    };
  }

  private getCriticalMultiplier(damageSource: any): number {
    // Different sources have different critical multipliers
    // This could be expanded based on weapon types, skills, etc.
    return 1.5;
  }
}

export interface ItemDrop {
  readonly itemType: string;
  readonly quantity: number;
  readonly position: { x: number; y: number };
  readonly condition?: any; // item condition/quality
}

export class DropService {
  calculateDrops(entity: DamageableEntity, killingBlow: DamageEvent): ItemDrop[] {
    const drops: ItemDrop[] = [];

    // Guaranteed drops
    for (const entry of entity.dropTable.guaranteed) {
      if (this.meetsCondition(entry.condition, killingBlow)) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({
          itemType: entry.itemType,
          quantity,
          position: entity.position,
        });
      }
    }

    // Possible drops (probability-based)
    for (const entry of entity.dropTable.possible) {
      if (Math.random() < entry.probability && this.meetsCondition(entry.condition, killingBlow)) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({
          itemType: entry.itemType,
          quantity,
          position: entity.position,
        });
      }
    }

    // Rare drops
    for (const entry of entity.dropTable.rare) {
      if (
        Math.random() < entry.probability * 0.1 && // rare drops are 10x less likely
        this.meetsCondition(entry.condition, killingBlow)
      ) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({
          itemType: entry.itemType,
          quantity,
          position: entity.position,
        });
      }
    }

    // Apply modifiers
    return this.applyDropModifiers(drops, entity.dropTable.modifiers, killingBlow);
  }

  private meetsCondition(condition: any, killingBlow: DamageEvent): boolean {
    if (!condition) return true;

    if (condition.damageType && condition.damageType !== killingBlow.type) {
      return false;
    }

    if (condition.tool && condition.tool !== killingBlow.source.weaponType) {
      return false;
    }

    // TODO: Add skill level checks when skills are implemented

    return true;
  }

  private rollQuantity(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private applyDropModifiers(
    drops: ItemDrop[],
    modifiers: DropModifier[],
    killingBlow: DamageEvent,
  ): ItemDrop[] {
    for (const modifier of modifiers) {
      switch (modifier.type) {
        case "tool_bonus":
          if (this.usedTool(killingBlow, modifier.condition)) {
            drops.forEach(
              (drop) => (drop.quantity = Math.floor(drop.quantity * modifier.multiplier)),
            );
          }
          break;
        case "skill_bonus":
          // TODO: Implement skill bonus when skills system is ready
          break;
        case "damage_type_bonus":
          if (killingBlow.type === modifier.condition.damageType) {
            drops.forEach(
              (drop) => (drop.quantity = Math.floor(drop.quantity * modifier.multiplier)),
            );
          }
          break;
      }
    }
    return drops;
  }

  private usedTool(killingBlow: DamageEvent, condition: any): boolean {
    return killingBlow.source.weaponType === condition.tool;
  }
}