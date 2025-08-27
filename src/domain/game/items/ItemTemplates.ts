import {
  BaseItemType,
  ItemQuality,
  ItemRarity,
  ToolType,
  WeaponType,
  MaterialType,
  ConsumableType,
  ToolAbility,
  EffectType,
  ProcessingMethod,
} from "./Item";
import type { ItemEffect } from "./Item";
import { DamageType } from "../damage/DamageableEntity";
import type { ItemTemplate, ItemModifier } from "./ItemFactory";

export interface ToolTemplate {
  readonly id: string;
  readonly effectiveness: Array<[string, number]>;
  readonly energyCost: number;
  readonly skillBonus?: Array<[string, number]>;
  readonly specialAbilities?: (typeof ToolAbility)[keyof typeof ToolAbility][];
}

export interface WeaponTemplate {
  readonly id: string;
  readonly damage: { base: number; type: DamageType; criticalMultiplier: number };
  readonly attackSpeed: number;
  readonly range: number;
  readonly criticalChance: number;
  readonly statusEffects?: Array<{ type: string; duration: number; intensity: number }>;
}

export interface MaterialTemplate {
  readonly id: string;
  readonly processingMethods: (typeof ProcessingMethod)[keyof typeof ProcessingMethod][];
  readonly derivatives: string[];
  readonly purityLevel?: number;
}

export interface ConsumableTemplate {
  readonly id: string;
  readonly effects: ItemEffect[];
  readonly duration: number;
  readonly cooldown?: number;
}

export class ItemTemplates {
  private templates: Map<string, ItemTemplate> = new Map();
  private modifiers: Map<string, ItemModifier> = new Map();

  constructor() {
    this.initializeTemplates();
    this.initializeModifiers();
  }

  getTemplate(id: string): ItemTemplate | undefined {
    return this.templates.get(id);
  }

  getModifier(id: string): ItemModifier | undefined {
    return this.modifiers.get(id);
  }

  getToolTemplate(toolType: ToolType): ToolTemplate {
    switch (toolType) {
      case ToolType.AXE:
        return {
          id: "iron_axe",
          effectiveness: [
            ["chop_wood", 2.0],
            ["combat_melee", 1.5],
          ],
          energyCost: 10,
          specialAbilities: [ToolAbility.TREE_FELLING],
        };
      case ToolType.PICKAXE:
        return {
          id: "iron_pickaxe",
          effectiveness: [
            ["mine_stone", 2.0],
            ["mine_ore", 1.8],
          ],
          energyCost: 12,
          specialAbilities: [ToolAbility.HEAVY_IMPACT],
        };
      case ToolType.KNIFE:
        return {
          id: "iron_knife",
          effectiveness: [
            ["cut_material", 1.5],
            ["combat_melee", 1.2],
          ],
          energyCost: 5,
          specialAbilities: [ToolAbility.PRECISION_CUTTING],
        };
      default:
        throw new Error(`No template for tool type: ${toolType}`);
    }
  }

  getWeaponTemplate(weaponType: WeaponType): WeaponTemplate {
    switch (weaponType) {
      case WeaponType.MELEE:
        return {
          id: "iron_sword",
          damage: { base: 45, type: DamageType.PHYSICAL, criticalMultiplier: 1.5 },
          attackSpeed: 1.2,
          range: 1.5,
          criticalChance: 0.1,
        };
      default:
        throw new Error(`No template for weapon type: ${weaponType}`);
    }
  }

  getMaterialTemplate(materialType: MaterialType): MaterialTemplate {
    switch (materialType) {
      case MaterialType.WOOD:
        return {
          id: "wood",
          processingMethods: [ProcessingMethod.MACHINING],
          derivatives: ["wooden_planks", "stick", "charcoal"],
          purityLevel: 0.8,
        };
      case MaterialType.METAL_ORE:
        return {
          id: "iron_ore",
          processingMethods: [ProcessingMethod.SMELTING],
          derivatives: ["iron_ingot"],
          purityLevel: 0.6,
        };
      default:
        throw new Error(`No template for material type: ${materialType}`);
    }
  }

  getConsumableTemplate(consumableType: ConsumableType): ConsumableTemplate {
    switch (consumableType) {
      case ConsumableType.FOOD:
        return {
          id: "cooked_meat",
          effects: [
            { type: EffectType.RESTORE_HEALTH, amount: 25, duration: 0 },
            { type: EffectType.RESTORE_HUNGER, amount: 40, duration: 0 },
          ],
          duration: 0,
          cooldown: 0,
        };
      default:
        throw new Error(`No template for consumable type: ${consumableType}`);
    }
  }

  private initializeTemplates(): void {
    // Tool templates
    this.templates.set("iron_axe", {
      id: "iron_axe",
      baseType: BaseItemType.TOOL,
      name: "Iron Axe",
      description: "A sturdy iron axe for chopping wood and combat",
      properties: {
        weight: 2.5,
        volume: 2,
        stackable: false,
        maxStackSize: 1,
        durability: {
          maxDurability: 200,
          currentDurability: 200,
          repairability: {
            canRepair: true,
            requiredMaterials: ["iron_ingot", "wood"],
            skillRequired: "blacksmithing",
            repairCost: 10,
          },
          degradationRate: 1,
        },
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: {
        effectiveness: 2.0,
        value: 150,
      },
    });

    this.templates.set("iron_pickaxe", {
      id: "iron_pickaxe",
      baseType: BaseItemType.TOOL,
      name: "Iron Pickaxe",
      description: "A reliable iron pickaxe for mining stone and ore",
      properties: {
        weight: 3.0,
        volume: 2.5,
        stackable: false,
        maxStackSize: 1,
        durability: {
          maxDurability: 180,
          currentDurability: 180,
          repairability: {
            canRepair: true,
            requiredMaterials: ["iron_ingot", "wood"],
            skillRequired: "blacksmithing",
            repairCost: 12,
          },
          degradationRate: 1.2,
        },
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: {
        effectiveness: 2.0,
        value: 180,
      },
    });

    // Material templates
    this.templates.set("wood", {
      id: "wood",
      baseType: BaseItemType.MATERIAL,
      name: "Wood",
      description: "Raw wood from trees, useful for crafting",
      properties: {
        weight: 0.5,
        volume: 1,
        stackable: true,
        maxStackSize: 50,
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.ABUNDANT,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: {
        value: 2,
      },
    });

    this.templates.set("iron_ore", {
      id: "iron_ore",
      baseType: BaseItemType.MATERIAL,
      name: "Iron Ore",
      description: "Raw iron ore that can be smelted into ingots",
      properties: {
        weight: 1.0,
        volume: 0.8,
        stackable: true,
        maxStackSize: 50,
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: {
        value: 5,
      },
    });

    // Consumable templates
    this.templates.set("cooked_meat", {
      id: "cooked_meat",
      baseType: BaseItemType.CONSUMABLE,
      name: "Cooked Meat",
      description: "Nutritious cooked meat that restores health and hunger",
      properties: {
        weight: 0.5,
        volume: 0.3,
        stackable: true,
        maxStackSize: 20,
        perishable: {
          maxFreshness: 72,
          currentFreshness: 72,
          spoilageRate: 1.0,
          preservationMethods: [],
        },
        quality: ItemQuality.COMMON,
        rarity: ItemRarity.COMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: {
        value: 8,
        nutritionValue: 40,
      },
      effects: [
        { type: EffectType.RESTORE_HEALTH, amount: 25, duration: 0 },
        { type: EffectType.RESTORE_HUNGER, amount: 40, duration: 0 },
      ],
    });
  }

  private initializeModifiers(): void {
    this.modifiers.set("sharp", {
      name: "Sharp",
      description: "Increases cutting effectiveness",
      statChanges: new Map([["effectiveness", 0.2]]),
      rarity: ItemRarity.UNCOMMON,
      stackable: false,
    });

    this.modifiers.set("durable", {
      name: "Durable",
      description: "Increases item durability",
      statChanges: new Map([["durability", 50]]),
      rarity: ItemRarity.UNCOMMON,
      stackable: false,
    });

    this.modifiers.set("lightweight", {
      name: "Lightweight",
      description: "Reduces item weight",
      statChanges: new Map([["weight", -0.5]]),
      rarity: ItemRarity.RARE,
      stackable: false,
    });
  }
}
