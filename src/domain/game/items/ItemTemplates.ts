import { DamageType } from "../damage/DamageableEntity";
import type { ItemEffect } from "./Item";
import {
  BaseItemType,
  ConsumableType,
  EffectType,
  ItemQuality,
  ItemRarity,
  MaterialType,
  ProcessingMethod,
  ToolAbility,
  ToolType,
  WeaponType,
} from "./Item";
import type { ItemModifier, ItemTemplate } from "./ItemFactory";

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
    // Reset with a new, fun catalog. All effects unimplemented for now.
    const add = (tpl: ItemTemplate): void => {
      this.templates.set(tpl.id, tpl);
    };
    const common = ItemQuality.COMMON;
    const abundant = ItemRarity.ABUNDANT;
    const commonRarity = ItemRarity.COMMON;

    // Medical & boosters
    add({
      id: "health_pack_small",
      baseType: BaseItemType.CONSUMABLE,
      name: "Small Health Pack",
      description: "Restores a small amount of health.",
      properties: {
        weight: 0.2,
        volume: 0.2,
        stackable: true,
        maxStackSize: 20,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 15 },
      icon: "items/health_pack_small.svg",
      category: "medical",
    });
    add({
      id: "health_pack_large",
      baseType: BaseItemType.CONSUMABLE,
      name: "Large Health Pack",
      description: "Restores a large amount of health.",
      properties: {
        weight: 0.5,
        volume: 0.4,
        stackable: true,
        maxStackSize: 10,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 40 },
      icon: "items/health_pack_large.svg",
      category: "medical",
    });
    add({
      id: "xp_pack_small",
      baseType: BaseItemType.CONSUMABLE,
      name: "Small XP Pack",
      description: "Instantly grants a small amount of XP.",
      properties: {
        weight: 0,
        volume: 0,
        stackable: true,
        maxStackSize: 9999,
        quality: common,
        rarity: commonRarity,
        tradeable: false,
        dropOnDeath: false,
      },
      stats: { value: 5 },
      icon: "items/xp_pack_small.svg",
      category: "boosters",
      autoUseOnPickup: true,
    });
    add({
      id: "xp_pack_large",
      baseType: BaseItemType.CONSUMABLE,
      name: "Large XP Pack",
      description: "Instantly grants a large amount of XP.",
      properties: {
        weight: 0,
        volume: 0,
        stackable: true,
        maxStackSize: 9999,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: false,
        dropOnDeath: false,
      },
      stats: { value: 15 },
      icon: "items/xp_pack_large.svg",
      category: "boosters",
      autoUseOnPickup: true,
    });

    // Materials
    add({
      id: "body_parts",
      baseType: BaseItemType.MATERIAL,
      name: "Body Parts",
      description: "Assorted creature parts. Potentially useful for crafting.",
      properties: {
        weight: 0.4,
        volume: 0.5,
        stackable: true,
        maxStackSize: 50,
        quality: common,
        rarity: abundant,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 3 },
      icon: "items/body_parts.svg",
      category: "materials",
    });
    add({
      id: "rocket_fuel",
      baseType: BaseItemType.MATERIAL,
      name: "Rocket Fuel",
      description: "Highly volatile fuel for rockets.",
      properties: {
        weight: 1.0,
        volume: 1.0,
        stackable: true,
        maxStackSize: 10,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 30 },
      icon: "items/rocket_fuel.svg",
      category: "materials",
    });

    // Equipment
    add({
      id: "shield_mk1",
      baseType: BaseItemType.EQUIPMENT,
      name: "Shield Mk I",
      description: "Basic personal energy shield.",
      properties: {
        weight: 2.0,
        volume: 1.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 120 },
      icon: "items/shield_mk1.svg",
      category: "equipment",
    });
    add({
      id: "shield_mk2",
      baseType: BaseItemType.EQUIPMENT,
      name: "Shield Mk II",
      description: "Improved energy shield with higher capacity.",
      properties: {
        weight: 2.5,
        volume: 1.2,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 220 },
      icon: "items/shield_mk2.svg",
      category: "equipment",
    });
    add({
      id: "armor_combat",
      baseType: BaseItemType.EQUIPMENT,
      name: "Combat Armor",
      description: "Protective armor for harsh encounters.",
      properties: {
        weight: 6.0,
        volume: 3.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 260 },
      icon: "items/armor_combat.svg",
      category: "equipment",
    });
    add({
      id: "night_vision_goggles",
      baseType: BaseItemType.EQUIPMENT,
      name: "Night Vision Goggles",
      description: "See in the dark.",
      properties: {
        weight: 0.7,
        volume: 0.6,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 140 },
      icon: "items/night_vision_goggles.svg",
      category: "equipment",
    });
    add({
      id: "translator_device",
      baseType: BaseItemType.EQUIPMENT,
      name: "Translator Device",
      description: "Translates alien languages.",
      properties: {
        weight: 0.8,
        volume: 0.4,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 300 },
      icon: "items/translator_device.svg",
      category: "equipment",
    });
    add({
      id: "space_suit",
      baseType: BaseItemType.EQUIPMENT,
      name: "Space Suit",
      description: "Required for EVA.",
      properties: {
        weight: 9.0,
        volume: 6.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: false,
        dropOnDeath: false,
      },
      stats: { value: 500 },
      icon: "items/space_suit.svg",
      category: "equipment",
    });
    add({
      id: "flashlight",
      baseType: BaseItemType.EQUIPMENT,
      name: "Flashlight",
      description: "A reliable source of light.",
      properties: {
        weight: 0.4,
        volume: 0.3,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: abundant,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 20 },
      icon: "items/flashlight.svg",
      category: "utilities",
    });
    add({
      id: "tent",
      baseType: BaseItemType.EQUIPMENT,
      name: "Tent",
      description: "Portable shelter for the night.",
      properties: {
        weight: 3.5,
        volume: 4.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 90 },
      icon: "items/tent.svg",
      category: "utilities",
    });
    add({
      id: "inflatable_raft",
      baseType: BaseItemType.EQUIPMENT,
      name: "Inflatable Raft",
      description: "Cross bodies of water with ease.",
      properties: {
        weight: 4.0,
        volume: 5.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 160 },
      icon: "items/inflatable_raft.svg",
      category: "utilities",
    });

    // Weapons
    add({
      id: "gun_pistol",
      baseType: BaseItemType.WEAPON,
      name: "Pistol",
      description: "Standard sidearm.",
      properties: {
        weight: 1.1,
        volume: 0.8,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 180 },
      icon: "items/gun_pistol.svg",
      category: "weapons",
    });
    add({
      id: "gun_rifle",
      baseType: BaseItemType.WEAPON,
      name: "Rifle",
      description: "Long-range firearm.",
      properties: {
        weight: 3.2,
        volume: 2.8,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 320 },
      icon: "items/gun_rifle.svg",
      category: "weapons",
    });
    add({
      id: "melee_knife",
      baseType: BaseItemType.WEAPON,
      name: "Knife",
      description: "Lightweight melee weapon.",
      properties: {
        weight: 0.4,
        volume: 0.2,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: abundant,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 40 },
      icon: "items/melee_knife.svg",
      category: "weapons",
    });
    add({
      id: "melee_baton",
      baseType: BaseItemType.WEAPON,
      name: "Baton",
      description: "Sturdy melee weapon.",
      properties: {
        weight: 0.9,
        volume: 0.6,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 60 },
      icon: "items/melee_baton.svg",
      category: "weapons",
    });

    // Explosives & utilities
    add({
      id: "landmine",
      baseType: BaseItemType.CONSUMABLE,
      name: "Landmine",
      description: "Explosive triggered by proximity.",
      properties: {
        weight: 1.5,
        volume: 1.0,
        stackable: true,
        maxStackSize: 5,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 120 },
      icon: "items/landmine.svg",
      category: "explosives",
    });
    add({
      id: "remote_bomb",
      baseType: BaseItemType.CONSUMABLE,
      name: "Remote Bomb",
      description: "Explosive detonated remotely.",
      properties: {
        weight: 1.8,
        volume: 1.2,
        stackable: true,
        maxStackSize: 5,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 180 },
      icon: "items/remote_bomb.svg",
      category: "explosives",
    });
    add({
      id: "decoy",
      baseType: BaseItemType.CONSUMABLE,
      name: "Decoy",
      description: "Distract enemies with a fake target.",
      properties: {
        weight: 0.6,
        volume: 0.5,
        stackable: true,
        maxStackSize: 10,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 50 },
      icon: "items/decoy.svg",
      category: "utilities",
    });
    add({
      id: "smokescreen",
      baseType: BaseItemType.CONSUMABLE,
      name: "Smokescreen",
      description: "Obscures vision with dense smoke.",
      properties: {
        weight: 0.5,
        volume: 0.4,
        stackable: true,
        maxStackSize: 10,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 45 },
      icon: "items/smokescreen.svg",
      category: "utilities",
    });

    // Traps
    add({
      id: "animal_trap",
      baseType: BaseItemType.TOOL,
      name: "Animal Trap",
      description: "Captures small creatures.",
      properties: {
        weight: 1.2,
        volume: 1.0,
        stackable: true,
        maxStackSize: 5,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 70 },
      icon: "items/animal_trap.svg",
      category: "traps",
    });

    // Consumables (food & drink)
    add({
      id: "alien_beer",
      baseType: BaseItemType.CONSUMABLE,
      name: "Alien Beer",
      description: "A curious alien brew. Effects unknown.",
      properties: {
        weight: 0.7,
        volume: 0.5,
        stackable: true,
        maxStackSize: 12,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 25 },
      icon: "items/alien_beer.svg",
      category: "consumables",
    });

    // Starting kit
    add({
      id: "ten_foot_pole",
      baseType: BaseItemType.EQUIPMENT,
      name: "Ten Foot Pole",
      description: "Indispensable for prodding suspicious floors and walls.",
      properties: {
        weight: 3.0,
        volume: 6.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 35 },
      icon: "items/ten_foot_pole.svg",
      category: "utilities",
    });
    add({
      id: "towel",
      baseType: BaseItemType.EQUIPMENT,
      name: "Towel",
      description: "A massively useful travel companion.",
      properties: {
        weight: 0.2,
        volume: 0.6,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 10 },
      icon: "items/towel.svg",
      category: "utilities",
    });

    // Fun collectibles & tools
    add({
      id: "sonic_screwdriver",
      baseType: BaseItemType.TOOL,
      name: "Sonic Screwdriver",
      description: "It opens things. And more.",
      properties: {
        weight: 0.3,
        volume: 0.2,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 500 },
      icon: "items/sonic_screwdriver.svg",
      category: "tools",
    });
    add({
      id: "lightsaber",
      baseType: BaseItemType.WEAPON,
      name: "Lightsaber",
      description: "Elegant weapon for a more civilized age.",
      properties: {
        weight: 1.0,
        volume: 0.8,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.LEGENDARY,
        tradeable: false,
        dropOnDeath: false,
      },
      stats: { value: 2000 },
      icon: "items/lightsaber.svg",
      category: "weapons",
    });
    add({
      id: "tricorder",
      baseType: BaseItemType.TOOL,
      name: "Tricorder",
      description: "Multifunction handheld sensor suite.",
      properties: {
        weight: 0.7,
        volume: 0.5,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: false,
      },
      stats: { value: 600 },
      icon: "items/tricorder.svg",
      category: "tools",
    });
    add({
      id: "lose_the_game_book",
      baseType: BaseItemType.ARTIFACT,
      name: "L.O.S.E., The Game",
      description: "A cheeky tome about spacefaring misadventures.",
      properties: {
        weight: 0.9,
        volume: 0.8,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: commonRarity,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 15 },
      icon: "items/lose_the_game_book.svg",
      category: "artifacts",
    });
    add({
      id: "hitchhikers_guide",
      baseType: BaseItemType.ARTIFACT,
      name: "The Hitchhiker's Guide",
      description: "Don't panic.",
      properties: {
        weight: 0.9,
        volume: 0.8,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 42 },
      icon: "items/hitchhikers_guide.svg",
      category: "artifacts",
    });
    add({
      id: "babel_fish",
      baseType: BaseItemType.ARTIFACT,
      name: "Babel Fish",
      description: "Mysterious translator organism.",
      properties: {
        weight: 0.1,
        volume: 0.1,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.EPIC,
        tradeable: false,
        dropOnDeath: false,
      },
      stats: { value: 999 },
      icon: "items/babel_fish.svg",
      category: "artifacts",
    });
    add({
      id: "starfleet_badge",
      baseType: BaseItemType.ARTIFACT,
      name: "Starfleet Badge",
      description: "A communicator pin from a storied fleet.",
      properties: {
        weight: 0.05,
        volume: 0.02,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 120 },
      icon: "items/starfleet_badge.svg",
      category: "artifacts",
    });
    add({
      id: "hempen_rope_50ft",
      baseType: BaseItemType.EQUIPMENT,
      name: "50ft Hempen Rope",
      description: "Sturdy rope for climbing and hauling.",
      properties: {
        weight: 4.5,
        volume: 2.0,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: abundant,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 25 },
      icon: "items/hempen_rope_50ft.svg",
      category: "utilities",
    });
    add({
      id: "treasure_map_1",
      baseType: BaseItemType.ARTIFACT,
      name: "Treasure Map I",
      description: "A worn map marking the first clue.",
      properties: {
        weight: 0.05,
        volume: 0.01,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.UNCOMMON,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 75 },
      icon: "items/treasure_map_1.svg",
      category: "artifacts",
    });
    add({
      id: "treasure_map_2",
      baseType: BaseItemType.ARTIFACT,
      name: "Treasure Map II",
      description: "The second piece of the puzzle.",
      properties: {
        weight: 0.05,
        volume: 0.01,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.RARE,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 100 },
      icon: "items/treasure_map_2.svg",
      category: "artifacts",
    });
    add({
      id: "treasure_map_3",
      baseType: BaseItemType.ARTIFACT,
      name: "Treasure Map III",
      description: "Final map leading to riches.",
      properties: {
        weight: 0.05,
        volume: 0.01,
        stackable: false,
        maxStackSize: 1,
        quality: common,
        rarity: ItemRarity.EPIC,
        tradeable: true,
        dropOnDeath: true,
      },
      stats: { value: 150 },
      icon: "items/treasure_map_3.svg",
      category: "artifacts",
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
