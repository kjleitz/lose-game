export interface Item {
  readonly id: string;
  readonly type: string;
  readonly baseType: BaseItemType;
  readonly name: string;
  readonly description: string;
  readonly properties: ItemProperties;
  readonly stats: ItemStats;
  readonly requirements: ItemRequirements;
  readonly effects: ItemEffect[];
  readonly metadata: ItemMetadata;
}

export enum BaseItemType {
  TOOL = "tool",
  WEAPON = "weapon", 
  MATERIAL = "material",
  CONSUMABLE = "consumable",
  EQUIPMENT = "equipment",
  CONTAINER = "container",
  SEED = "seed",
  BLUEPRINT = "blueprint",
  ARTIFACT = "artifact",
}

export interface ItemProperties {
  readonly weight: number;
  readonly volume: number; // for container capacity calculations
  readonly stackable: boolean;
  readonly maxStackSize: number;
  readonly durability?: DurabilityProperties;
  readonly perishable?: PerishableProperties;
  readonly quality: ItemQuality;
  readonly rarity: ItemRarity;
  readonly tradeable: boolean;
  readonly dropOnDeath: boolean;
}

export enum ItemQuality {
  CRUDE = "crude", // -20% effectiveness
  POOR = "poor", // -10% effectiveness  
  COMMON = "common", // baseline
  GOOD = "good", // +10% effectiveness
  EXCELLENT = "excellent", // +25% effectiveness
  MASTERWORK = "masterwork", // +50% effectiveness
  LEGENDARY = "legendary", // +100% effectiveness, special properties
}

export enum ItemRarity {
  ABUNDANT = "abundant", // found everywhere
  COMMON = "common", // easily found
  UNCOMMON = "uncommon", // somewhat rare
  RARE = "rare", // hard to find
  EPIC = "epic", // very rare
  LEGENDARY = "legendary", // extremely rare
  UNIQUE = "unique", // one-of-a-kind
}

export interface DurabilityProperties {
  readonly maxDurability: number;
  currentDurability: number;
  readonly repairability: RepairInfo;
  readonly degradationRate: number; // per use
}

export interface RepairInfo {
  readonly canRepair: boolean;
  readonly requiredMaterials: string[];
  readonly skillRequired?: string;
  readonly repairCost: number;
}

export interface PerishableProperties {
  readonly maxFreshness: number; // in game hours
  currentFreshness: number;
  readonly spoilageRate: number; // freshness loss per hour
  readonly preservationMethods: PreservationMethod[];
}

export enum PreservationMethod {
  REFRIGERATION = "refrigeration",
  SALT_CURED = "salt_cured", 
  DRIED = "dried",
  CANNED = "canned",
  SMOKED = "smoked",
}

export interface ItemStats {
  readonly effectiveness?: number;
  readonly durability?: number;
  readonly value: number;
  readonly nutritionValue?: number; // for food items
  readonly repairValue?: number; // for repair materials
}

export interface ItemRequirements {
  readonly skillLevel?: Map<string, number>; // minimum skill requirements
  readonly tools?: string[]; // required tools to use
  readonly environment?: string[]; // required environment conditions
}

export interface ItemEffect {
  readonly type: EffectType;
  readonly amount: number;
  readonly duration: number; // 0 for instant effects
  readonly conditions?: EffectCondition[];
}

export enum EffectType {
  RESTORE_HEALTH = "restore_health",
  RESTORE_HUNGER = "restore_hunger",
  RESTORE_THIRST = "restore_thirst",
  RESTORE_ENERGY = "restore_energy",
  BOOST_SPEED = "boost_speed",
  BOOST_STRENGTH = "boost_strength",
  RESIST_DAMAGE = "resist_damage",
  CURE_POISON = "cure_poison",
}

export interface EffectCondition {
  readonly type: string;
  readonly value: any;
}

export interface ItemMetadata {
  readonly origin?: string; // where item was found/crafted
  readonly craftedBy?: string; // who crafted it
  readonly discoveredAt?: number; // timestamp
  readonly modifications?: ItemModification[];
}

export interface ItemModification {
  readonly type: string;
  readonly description: string;
  readonly appliedAt: number;
  readonly appliedBy?: string;
}

export enum ItemCondition {
  PRISTINE = "pristine", // 100-90% durability/freshness
  GOOD = "good", // 90-70%
  WORN = "worn", // 70-50%
  DAMAGED = "damaged", // 50-25%
  BROKEN = "broken", // 25-1%
  DESTROYED = "destroyed", // 0%
  SPOILED = "spoiled", // for food items
}

// Specialized item types

export interface Tool extends Item {
  readonly toolType: ToolType;
  readonly effectiveness: Map<string, number>; // effectiveness per action
  readonly energyCost: number; // stamina cost per use
  readonly skillBonus: Map<string, number>; // skill bonuses
  readonly specialAbilities: ToolAbility[];
}

export enum ToolType {
  AXE = "axe",
  PICKAXE = "pickaxe",
  SHOVEL = "shovel",
  KNIFE = "knife",
  HAMMER = "hammer",
  WRENCH = "wrench",
  SCANNER = "scanner",
  FISHING_ROD = "fishing_rod",
  TRAP = "trap",
}

export enum ToolAbility {
  TREE_FELLING = "tree_felling",
  PRECISION_CUTTING = "precision_cutting",
  HEAVY_IMPACT = "heavy_impact",
  SCANNING = "scanning",
}

export interface Weapon extends Tool {
  readonly weaponType: WeaponType;
  readonly damage: DamageProfile;
  readonly attackSpeed: number;
  readonly range: number;
  readonly criticalChance: number;
  readonly statusEffects: StatusEffect[];
}

export enum WeaponType {
  MELEE = "melee",
  RANGED = "ranged", 
  THROWN = "thrown",
  EXPLOSIVE = "explosive",
}

export interface DamageProfile {
  readonly base: number;
  readonly type: string; // matches DamageType from damage system
  readonly criticalMultiplier: number;
}

export interface StatusEffect {
  readonly type: string;
  readonly duration: number;
  readonly intensity: number;
}

export interface Material extends Item {
  readonly materialType: MaterialType;
  readonly processingMethods: ProcessingMethod[];
  readonly derivatives: string[]; // what can be made from this
  readonly purityLevel: number; // affects crafting results
}

export enum MaterialType {
  METAL_ORE = "metal_ore",
  STONE = "stone",
  WOOD = "wood", 
  FIBER = "fiber",
  CHEMICAL = "chemical",
  BIOLOGICAL = "biological",
  CRYSTAL = "crystal",
  COMPOSITE = "composite",
}

export enum ProcessingMethod {
  SMELTING = "smelting",
  FORGING = "forging",
  MACHINING = "machining",
  WEAVING = "weaving",
  DISTILLATION = "distillation",
}

export interface Consumable extends Item {
  readonly consumableType: ConsumableType;
  readonly effects: ItemEffect[];
  readonly duration: number; // effect duration in seconds
  readonly cooldown: number; // time before can use again
}

export enum ConsumableType {
  FOOD = "food",
  MEDICINE = "medicine",
  STIMULANT = "stimulant", 
  POISON = "poison",
  UTILITY = "utility", // explosives, flares, etc.
}