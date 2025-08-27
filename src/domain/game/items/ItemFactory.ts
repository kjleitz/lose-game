import {
  type Item,
  ItemQuality,
  ItemRarity,
  type Tool,
  type Weapon,
  type Material,
  type Consumable,
  type ItemProperties,
  type ItemStats,
  type ItemRequirements,
  type ItemEffect,
  BaseItemType,
  ToolType,
  WeaponType,
  MaterialType,
  ConsumableType,
} from "./Item";
import { ItemTemplates } from "./ItemTemplates";

export class ItemFactory {
  private templates = new ItemTemplates();

  createItem(templateId: string, quality?: ItemQuality, modifiers?: string[]): Item {
    const template = this.templates.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Start with base item from template
    let item = this.createBaseItem(template);

    // Apply quality modifier
    if (quality && quality !== ItemQuality.COMMON) {
      item = this.applyQualityModifier(item, quality);
    }

    // Apply additional modifiers
    if (modifiers) {
      for (const modifierId of modifiers) {
        const modifier = this.templates.getModifier(modifierId);
        if (modifier) {
          item = this.applyModifier(item, modifier);
        }
      }
    }

    return item;
  }

  private createBaseItem(template: ItemTemplate): Item {
    const id = this.generateItemId();

    return {
      id,
      type: template.id,
      baseType: template.baseType,
      name: template.name,
      description: template.description,
      properties: { ...template.properties },
      stats: { ...template.stats },
      requirements: template.requirements || {},
      effects: template.effects || [],
      metadata: {
        discoveredAt: Date.now(),
      },
    };
  }

  private applyQualityModifier(item: Item, quality: ItemQuality): Item {
    const multiplier = this.getQualityMultiplier(quality);

    // Enhance stats based on quality
    const enhancedStats = { ...item.stats };
    if (enhancedStats.effectiveness) {
      enhancedStats.effectiveness *= multiplier;
    }
    if (enhancedStats.durability) {
      enhancedStats.durability *= multiplier;
    }
    if (enhancedStats.value) {
      enhancedStats.value *= multiplier;
    }

    // Update durability properties if item has them
    let enhancedProperties = { ...item.properties };
    if (item.properties.durability) {
      enhancedProperties = {
        ...enhancedProperties,
        durability: {
          ...item.properties.durability,
          maxDurability: Math.floor(item.properties.durability.maxDurability * multiplier),
          currentDurability: Math.floor(item.properties.durability.currentDurability * multiplier),
        },
      };
    }

    return {
      ...item,
      properties: {
        ...enhancedProperties,
        quality,
      },
      stats: enhancedStats,
      name: this.generateQualityName(item.name, quality),
    };
  }

  private applyModifier(item: Item, modifier: ItemModifier): Item {
    // Apply stat changes
    const modifiedStats = { ...item.stats };
    for (const [stat, change] of modifier.statChanges) {
      if (stat in modifiedStats) {
        if (stat === "effectiveness" && typeof modifiedStats.effectiveness === "number") {
          modifiedStats.effectiveness += change;
        } else if (stat === "durability" && typeof modifiedStats.durability === "number") {
          modifiedStats.durability += change;
        } else if (stat === "value" && typeof modifiedStats.value === "number") {
          modifiedStats.value += change;
        } else if (stat === "nutritionValue" && typeof modifiedStats.nutritionValue === "number") {
          modifiedStats.nutritionValue += change;
        } else if (stat === "repairValue" && typeof modifiedStats.repairValue === "number") {
          modifiedStats.repairValue += change;
        }
      }
    }

    // Add modification to metadata
    const newModification = {
      type: modifier.name,
      description: modifier.description,
      appliedAt: Date.now(),
    };

    return {
      ...item,
      stats: modifiedStats,
      metadata: {
        ...item.metadata,
        modifications: [...(item.metadata.modifications || []), newModification],
      },
    };
  }

  private getQualityMultiplier(quality: ItemQuality): number {
    switch (quality) {
      case ItemQuality.CRUDE:
        return 0.8; // -20%
      case ItemQuality.POOR:
        return 0.9; // -10%
      case ItemQuality.COMMON:
        return 1.0; // baseline
      case ItemQuality.GOOD:
        return 1.1; // +10%
      case ItemQuality.EXCELLENT:
        return 1.25; // +25%
      case ItemQuality.MASTERWORK:
        return 1.5; // +50%
      case ItemQuality.LEGENDARY:
        return 2.0; // +100%
      default:
        return 1.0;
    }
  }

  private generateQualityName(baseName: string, quality: ItemQuality): string {
    switch (quality) {
      case ItemQuality.CRUDE:
        return `Crude ${baseName}`;
      case ItemQuality.POOR:
        return `Poor ${baseName}`;
      case ItemQuality.COMMON:
        return baseName;
      case ItemQuality.GOOD:
        return `Fine ${baseName}`;
      case ItemQuality.EXCELLENT:
        return `Superior ${baseName}`;
      case ItemQuality.MASTERWORK:
        return `Masterwork ${baseName}`;
      case ItemQuality.LEGENDARY:
        return `Legendary ${baseName}`;
      default:
        return baseName;
    }
  }

  private generateItemId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Specialized factory methods for different item types
  createTool(toolType: ToolType, quality: ItemQuality = ItemQuality.COMMON): Tool {
    const template = this.templates.getToolTemplate(toolType);
    const base = this.createItem(template.id, quality);

    return {
      id: base.id,
      type: base.type,
      baseType: base.baseType,
      name: base.name,
      description: base.description,
      properties: base.properties,
      stats: base.stats,
      requirements: base.requirements,
      effects: base.effects,
      metadata: base.metadata,
      toolType,
      effectiveness: new Map(template.effectiveness),
      energyCost: template.energyCost,
      skillBonus: new Map(template.skillBonus || []),
      specialAbilities: template.specialAbilities || [],
    };
  }

  createWeapon(weaponType: WeaponType, quality: ItemQuality = ItemQuality.COMMON): Weapon {
    const template = this.templates.getWeaponTemplate(weaponType);
    const base = this.createItem(template.id, quality);

    return {
      id: base.id,
      type: base.type,
      baseType: base.baseType,
      name: base.name,
      description: base.description,
      properties: base.properties,
      stats: base.stats,
      requirements: base.requirements,
      effects: base.effects,
      metadata: base.metadata,
      weaponType,
      damage: template.damage,
      attackSpeed: template.attackSpeed,
      range: template.range,
      criticalChance: template.criticalChance,
      statusEffects: template.statusEffects || [],
      toolType: ToolType.KNIFE, // weapons are also tools
      effectiveness: new Map([["combat_melee", template.damage.base]]),
      energyCost: 5,
      skillBonus: new Map(),
      specialAbilities: [],
    };
  }

  createMaterial(materialType: MaterialType, _quantity: number = 1): Material {
    const template = this.templates.getMaterialTemplate(materialType);
    const base = this.createItem(template.id);

    // Materials are typically stackable
    const enhancedProperties = {
      ...base.properties,
      stackable: true,
      maxStackSize: 50,
    };

    return {
      id: base.id,
      type: base.type,
      baseType: base.baseType,
      name: base.name,
      description: base.description,
      properties: enhancedProperties,
      stats: base.stats,
      requirements: base.requirements,
      effects: base.effects,
      metadata: base.metadata,
      materialType,
      processingMethods: template.processingMethods,
      derivatives: template.derivatives,
      purityLevel: template.purityLevel || 1.0,
    };
  }

  createConsumable(consumableType: ConsumableType): Consumable {
    const template = this.templates.getConsumableTemplate(consumableType);
    const base = this.createItem(template.id);

    return {
      id: base.id,
      type: base.type,
      baseType: base.baseType,
      name: base.name,
      description: base.description,
      properties: base.properties,
      stats: base.stats,
      requirements: base.requirements,
      metadata: base.metadata,
      consumableType,
      effects: template.effects,
      duration: template.duration,
      cooldown: template.cooldown || 0,
    };
  }
}

// Supporting interfaces
export interface ItemTemplate {
  readonly id: string;
  readonly baseType: BaseItemType;
  readonly name: string;
  readonly description: string;
  readonly properties: ItemProperties;
  readonly stats: ItemStats;
  readonly requirements?: ItemRequirements;
  readonly effects?: ItemEffect[];
}

export interface ItemModifier {
  readonly name: string;
  readonly description: string;
  readonly statChanges: Map<string, number>;
  readonly rarity: ItemRarity;
  readonly stackable: boolean;
}
