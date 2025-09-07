import type { Point2D } from "../../../shared/types/geometry";
import type { TemplateId } from "../items/ItemTemplates";
import type {
  DamageableEntity,
  DamageEvent,
  DamageResult,
  DropCondition,
  DropModifier,
} from "./DamageableEntity";

export class DamageSystem {
  processDamage(target: DamageableEntity, damage: DamageEvent): DamageResult {
    return target.takeDamage(damage);
  }
}

export interface ItemDrop {
  readonly itemTemplateId: TemplateId;
  readonly quantity: number;
  readonly position: Point2D;
  readonly condition?: import("../items/Item").ItemCondition; // item condition/quality
}

export class DropService {
  calculateDrops(entity: DamageableEntity, killingBlow: DamageEvent): ItemDrop[] {
    const drops: ItemDrop[] = [];

    // Guaranteed drops
    for (const entry of entity.dropTable.guaranteed) {
      if (this.meetsCondition(entry.condition, killingBlow)) {
        const quantity = this.rollQuantity(entry.minQuantity, entry.maxQuantity);
        drops.push({
          itemTemplateId: entry.itemTemplateId,
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
          itemTemplateId: entry.itemTemplateId,
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
          itemTemplateId: entry.itemTemplateId,
          quantity,
          position: entity.position,
        });
      }
    }

    // Apply modifiers
    return this.applyDropModifiers(drops, entity.dropTable.modifiers, killingBlow);
  }

  private meetsCondition(condition: DropCondition | undefined, killingBlow: DamageEvent): boolean {
    if (condition == null) return true;

    if (condition.damageType != null && condition.damageType !== killingBlow.type) {
      return false;
    }

    if (condition.tool != null && condition.tool !== killingBlow.source.weaponType) {
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
    let adjusted = drops;
    for (const modifier of modifiers) {
      if (modifier.type === "tool_bonus") {
        const cond = modifier.condition;
        if (this.usedTool(killingBlow, cond)) {
          adjusted = adjusted.map((drop) => ({
            ...drop,
            quantity: Math.floor(drop.quantity * modifier.multiplier),
          }));
        }
      } else if (modifier.type === "skill_bonus") {
        // TODO: Implement skill bonus when skills system is ready
      } else if (modifier.type === "damage_type_bonus") {
        const cond = modifier.condition;
        if (killingBlow.type === cond.damageType) {
          adjusted = adjusted.map((drop) => ({
            ...drop,
            quantity: Math.floor(drop.quantity * modifier.multiplier),
          }));
        }
      }
    }
    return adjusted;
  }

  private usedTool(killingBlow: DamageEvent, condition: { tool: string }): boolean {
    return killingBlow.source.weaponType === condition.tool;
  }
}
