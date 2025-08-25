# Item System Design

## Overview

The item system defines all physical objects that exist in the game world, from basic resources to complex tools and equipment. It provides a unified framework for item properties, behaviors, crafting relationships, and interactions that supports both immediate gameplay needs and long-term progression systems.

## Core Requirements

- **Unified item framework**: Consistent behavior across all item types
- **Rich item properties**: Stats, durability, quality, rarity, and special attributes
- **Crafting integration**: Clear recipes, material requirements, and skill dependencies
- **Tool mechanics**: Usage patterns, effectiveness bonuses, and specialization
- **Quality system**: Item tiers affecting performance and value
- **Dynamic properties**: Items that change based on usage, age, or modification

## Domain Model

### Core Item Structure

```typescript
interface Item {
  readonly id: ItemId;
  readonly type: ItemType;
  readonly baseType: BaseItemType;
  readonly name: string;
  readonly description: string;
  readonly properties: ItemProperties;
  readonly stats: ItemStats;
  readonly requirements: ItemRequirements;
  readonly effects: ItemEffect[];
  readonly metadata: ItemMetadata;
}

enum BaseItemType {
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

interface ItemProperties {
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

enum ItemQuality {
  CRUDE = "crude", // -20% effectiveness
  POOR = "poor", // -10% effectiveness
  COMMON = "common", // baseline
  GOOD = "good", // +10% effectiveness
  EXCELLENT = "excellent", // +25% effectiveness
  MASTERWORK = "masterwork", // +50% effectiveness
  LEGENDARY = "legendary", // +100% effectiveness, special properties
}

enum ItemRarity {
  ABUNDANT = "abundant", // found everywhere
  COMMON = "common", // easily found
  UNCOMMON = "uncommon", // somewhat rare
  RARE = "rare", // hard to find
  EPIC = "epic", // very rare
  LEGENDARY = "legendary", // extremely rare
  UNIQUE = "unique", // one-of-a-kind
}
```

### Specialized Item Types

```typescript
// Tools - items used to interact with the world
interface Tool extends Item {
  readonly toolType: ToolType;
  readonly effectiveness: Map<ActionType, number>; // effectiveness per action
  readonly energyCost: number; // stamina cost per use
  readonly skillBonus: Map<SkillType, number>; // skill bonuses
  readonly specialAbilities: ToolAbility[];
}

enum ToolType {
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

// Weapons - tools specialized for combat
interface Weapon extends Tool {
  readonly weaponType: WeaponType;
  readonly damage: DamageProfile;
  readonly attackSpeed: number;
  readonly range: number;
  readonly criticalChance: number;
  readonly statusEffects: StatusEffect[];
}

enum WeaponType {
  MELEE = "melee",
  RANGED = "ranged",
  THROWN = "thrown",
  EXPLOSIVE = "explosive",
}

// Materials - raw resources for crafting
interface Material extends Item {
  readonly materialType: MaterialType;
  readonly processingMethods: ProcessingMethod[];
  readonly derivatives: ItemType[]; // what can be made from this
  readonly purityLevel: number; // affects crafting results
}

enum MaterialType {
  METAL_ORE = "metal_ore",
  STONE = "stone",
  WOOD = "wood",
  FIBER = "fiber",
  CHEMICAL = "chemical",
  BIOLOGICAL = "biological",
  CRYSTAL = "crystal",
  COMPOSITE = "composite",
}

// Consumables - items used up when consumed
interface Consumable extends Item {
  readonly consumableType: ConsumableType;
  readonly effects: ConsumableEffect[];
  readonly duration: number; // effect duration in seconds
  readonly cooldown: number; // time before can use again
}

enum ConsumableType {
  FOOD = "food",
  MEDICINE = "medicine",
  STIMULANT = "stimulant",
  POISON = "poison",
  UTILITY = "utility", // explosives, flares, etc.
}
```

### Item Generation and Modification

```typescript
interface ItemGenerator {
  generateItem(template: ItemTemplate, modifiers?: ItemModifier[]): Item;
  applyQualityModifier(item: Item, quality: ItemQuality): Item;
  addRandomProperties(item: Item, rarity: ItemRarity): Item;
  enchantItem(item: Item, enchantment: ItemEnchantment): Item;
}

interface ItemTemplate {
  readonly baseType: BaseItemType;
  readonly category: string;
  readonly baseStats: ItemStats;
  readonly possibleModifiers: ItemModifier[];
  readonly craftingRecipe?: CraftingRecipe;
}

interface ItemModifier {
  readonly name: string;
  readonly description: string;
  readonly statChanges: Map<string, number>;
  readonly addedProperties: ItemProperty[];
  readonly rarity: ItemRarity;
  readonly stackable: boolean;
}
```

## System Architecture

### Domain Layer (`src/domain/game/items/`)

```
items/
├── Item.ts                     # Core item interface and base class
├── ItemFactory.ts              # Item creation and generation
├── ItemTemplate.ts             # Item template system
├── ItemModifier.ts             # Item enhancement and modification
├── types/                      # Specific item type implementations
│   ├── Tool.ts
│   ├── Weapon.ts
│   ├── Material.ts
│   ├── Consumable.ts
│   ├── Equipment.ts
│   └── Container.ts
├── properties/                 # Item property systems
│   ├── Durability.ts
│   ├── Quality.ts
│   ├── Rarity.ts
│   └── Enhancement.ts
├── catalog/                    # Item definitions
│   ├── Tools.ts
│   ├── Weapons.ts
│   ├── Materials.ts
│   ├── Food.ts
│   ├── Medicine.ts
│   └── Artifacts.ts
└── services/
    ├── ItemService.ts          # Item management
    ├── CraftingService.ts      # Item creation through crafting
    └── EnhancementService.ts   # Item modification and upgrades
```

### Integration Layer (`src/domain/integration/`)

```
integration/
├── ItemWorldInteraction.ts    # Items interacting with world
├── ItemCombatIntegration.ts   # Weapons and combat
├── ItemCraftingBridge.ts      # Crafting system integration
├── ItemTradeSystem.ts         # Trading and economy
└── ItemPersistence.ts         # Save/load item data
```

## Implementation Details

### Item Factory System

```typescript
class ItemFactory {
  private templates: Map<string, ItemTemplate> = new Map();
  private modifiers: Map<string, ItemModifier> = new Map();

  createItem(templateId: string, quality?: ItemQuality, modifiers?: string[]): Item {
    const template = this.templates.get(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    // Start with base item from template
    let item = this.createBaseItem(template);

    // Apply quality modifier
    if (quality && quality !== ItemQuality.COMMON) {
      item = this.applyQualityModifier(item, quality);
    }

    // Apply additional modifiers
    if (modifiers) {
      for (const modifierId of modifiers) {
        const modifier = this.modifiers.get(modifierId);
        if (modifier) {
          item = this.applyModifier(item, modifier);
        }
      }
    }

    return item;
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

    // Update item properties
    return {
      ...item,
      properties: {
        ...item.properties,
        quality,
      },
      stats: enhancedStats,
      name: this.generateQualityName(item.name, quality),
    };
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
    }
  }
}
```

### Tool Effectiveness System

```typescript
class ToolEffectivenessSystem {
  calculateEffectiveness(tool: Tool, action: ActionType, target?: any): number {
    let baseEffectiveness = tool.effectiveness.get(action) || 0;

    if (baseEffectiveness === 0) {
      return 0; // Tool can't perform this action
    }

    // Quality modifier
    const qualityBonus = this.getQualityBonus(tool.properties.quality);
    baseEffectiveness *= qualityBonus;

    // Durability modifier (worn tools are less effective)
    const durabilityModifier = this.getDurabilityModifier(tool);
    baseEffectiveness *= durabilityModifier;

    // Target-specific bonuses
    if (target) {
      const targetBonus = this.getTargetSpecificBonus(tool, action, target);
      baseEffectiveness *= targetBonus;
    }

    // Special abilities
    const abilityBonus = this.getAbilityBonus(tool, action);
    baseEffectiveness *= abilityBonus;

    return baseEffectiveness;
  }

  private getTargetSpecificBonus(tool: Tool, action: ActionType, target: any): number {
    // Example: Axes are extra effective against trees
    if (tool.toolType === ToolType.AXE && target.type === "tree") {
      return 1.5;
    }

    // Example: Pickaxes are effective against stone and ore
    if (tool.toolType === ToolType.PICKAXE && (target.type === "stone" || target.type === "ore")) {
      return 1.3;
    }

    // Example: Wrong tool penalty
    if (action === ActionType.CHOP_WOOD && tool.toolType !== ToolType.AXE) {
      return 0.5; // 50% penalty for using wrong tool
    }

    return 1.0; // no modifier
  }
}
```

### Item Durability and Wear

```typescript
class ItemDurabilityManager {
  useItem(item: Item, usage: ItemUsage): ItemUseResult {
    // Check if item can be used
    if (!this.canUseItem(item)) {
      return { success: false, reason: "Item is broken or unusable" };
    }

    // Calculate durability loss
    const durabilityLoss = this.calculateDurabilityLoss(item, usage);

    // Apply durability damage
    if (item.properties.durability) {
      const newDurability = Math.max(0, item.properties.durability.current - durabilityLoss);

      item.properties.durability.current = newDurability;

      // Check if item broke
      if (newDurability === 0) {
        return this.handleItemBreaking(item, usage);
      }

      // Update condition based on remaining durability
      this.updateItemCondition(item);
    }

    return {
      success: true,
      effectiveness: this.toolSystem.calculateEffectiveness(item as Tool, usage.action),
      durabilityLoss,
    };
  }

  private calculateDurabilityLoss(item: Item, usage: ItemUsage): number {
    let baseLoss = 1; // default durability loss per use

    // Heavy usage causes more wear
    switch (usage.intensity) {
      case UsageIntensity.LIGHT:
        baseLoss *= 0.5;
        break;
      case UsageIntensity.NORMAL:
        baseLoss *= 1.0;
        break;
      case UsageIntensity.HEAVY:
        baseLoss *= 2.0;
        break;
      case UsageIntensity.EXTREME:
        baseLoss *= 5.0;
        break;
    }

    // Environmental factors
    if (usage.environment === Environment.HARSH) {
      baseLoss *= 1.5;
    }

    // Quality affects durability loss (better quality = slower wear)
    const qualityModifier = this.getQualityDurabilityModifier(item.properties.quality);
    baseLoss *= qualityModifier;

    return Math.ceil(baseLoss);
  }
}
```

### Crafting Integration

```typescript
interface CraftingRecipe {
  readonly id: RecipeId;
  readonly name: string;
  readonly category: CraftingCategory;
  readonly ingredients: CraftingIngredient[];
  readonly result: CraftingResult;
  readonly requirements: CraftingRequirements;
  readonly time: number; // crafting time in seconds
  readonly experience: number; // experience gained
}

interface CraftingIngredient {
  readonly itemType: ItemType;
  readonly quantity: number;
  readonly qualityRequired?: ItemQuality;
  readonly consumeOnUse: boolean;
  readonly alternatives?: ItemType[]; // alternative materials
}

class CraftingSystem {
  craftItem(recipe: CraftingRecipe, ingredients: Map<ItemType, Item[]>): CraftingResult {
    // Validate ingredients
    const validation = this.validateIngredients(recipe, ingredients);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }

    // Calculate result quality based on ingredient quality
    const resultQuality = this.calculateResultQuality(recipe, ingredients);

    // Create the result item
    const resultItem = this.itemFactory.createItem(recipe.result.itemType, resultQuality);

    // Apply crafting bonuses based on tools and skills
    const craftingBonus = this.calculateCraftingBonus(recipe, ingredients);
    if (craftingBonus.extraYield > 0) {
      // Bonus items created
    }
    if (craftingBonus.qualityBonus > 0) {
      // Enhanced quality
    }

    // Consume ingredients
    this.consumeIngredients(recipe, ingredients);

    return {
      success: true,
      result: resultItem,
      bonusItems: craftingBonus.bonusItems,
      experience: recipe.experience,
    };
  }

  private calculateResultQuality(
    recipe: CraftingRecipe,
    ingredients: Map<ItemType, Item[]>,
  ): ItemQuality {
    let totalQualityScore = 0;
    let ingredientCount = 0;

    for (const ingredient of recipe.ingredients) {
      const items = ingredients.get(ingredient.itemType) || [];
      for (const item of items.slice(0, ingredient.quantity)) {
        totalQualityScore += this.getQualityScore(item.properties.quality);
        ingredientCount++;
      }
    }

    const averageQuality = totalQualityScore / Math.max(1, ingredientCount);
    return this.scoreToQuality(averageQuality);
  }
}
```

## Item Categories and Examples

### Tools

```typescript
const IRON_AXE: Tool = {
  id: "iron_axe",
  type: "iron_axe",
  baseType: BaseItemType.TOOL,
  name: "Iron Axe",
  description: "A sturdy iron axe for chopping wood and combat",
  toolType: ToolType.AXE,
  properties: {
    weight: 2.5,
    quality: ItemQuality.COMMON,
    rarity: ItemRarity.COMMON,
    stackable: false,
    durability: {
      max: 200,
      current: 200,
      repairMaterial: "iron_ingot",
    },
  },
  effectiveness: new Map([
    [ActionType.CHOP_WOOD, 2.0],
    [ActionType.COMBAT_MELEE, 1.5],
    [ActionType.BREAK_STONE, 0.3],
  ]),
  specialAbilities: [
    ToolAbility.TREE_FELLING, // can fell entire tree
  ],
};
```

### Materials

```typescript
const IRON_ORE: Material = {
  id: "iron_ore",
  type: "iron_ore",
  baseType: BaseItemType.MATERIAL,
  name: "Iron Ore",
  description: "Raw iron ore that can be smelted into ingots",
  materialType: MaterialType.METAL_ORE,
  properties: {
    weight: 1.0,
    stackable: true,
    maxStackSize: 50,
    quality: ItemQuality.COMMON,
    rarity: ItemRarity.COMMON,
  },
  processingMethods: [ProcessingMethod.SMELTING],
  derivatives: ["iron_ingot"],
  purityLevel: 0.8, // 80% pure iron
};

const IRON_INGOT: Material = {
  id: "iron_ingot",
  type: "iron_ingot",
  baseType: BaseItemType.MATERIAL,
  name: "Iron Ingot",
  description: "Pure iron ingot ready for crafting",
  materialType: MaterialType.METAL_ORE,
  properties: {
    weight: 0.8,
    stackable: true,
    maxStackSize: 30,
    quality: ItemQuality.COMMON,
    rarity: ItemRarity.COMMON,
  },
  processingMethods: [ProcessingMethod.FORGING, ProcessingMethod.MACHINING],
  derivatives: ["iron_axe", "iron_pickaxe", "iron_sword", "iron_nails"],
  purityLevel: 0.99,
};
```

### Food and Consumables

```typescript
const COOKED_MEAT: Consumable = {
  id: "cooked_meat",
  type: "cooked_meat",
  baseType: BaseItemType.CONSUMABLE,
  name: "Cooked Meat",
  description: "Nutritious cooked meat that restores health and hunger",
  consumableType: ConsumableType.FOOD,
  properties: {
    weight: 0.5,
    stackable: true,
    maxStackSize: 20,
    perishable: {
      maxFreshness: 72, // 72 hours
      spoilageRate: 1.0,
    },
    quality: ItemQuality.COMMON,
  },
  effects: [
    {
      type: EffectType.RESTORE_HEALTH,
      amount: 25,
      duration: 0, // instant
    },
    {
      type: EffectType.RESTORE_HUNGER,
      amount: 40,
      duration: 0,
    },
  ],
};
```

### Weapons

```typescript
const IRON_SWORD: Weapon = {
  id: "iron_sword",
  type: "iron_sword",
  baseType: BaseItemType.WEAPON,
  name: "Iron Sword",
  description: "A well-balanced iron sword",
  toolType: ToolType.WEAPON,
  weaponType: WeaponType.MELEE,
  properties: {
    weight: 1.8,
    quality: ItemQuality.COMMON,
    rarity: ItemRarity.COMMON,
    durability: {
      max: 150,
      current: 150,
    },
  },
  damage: {
    base: 45,
    type: DamageType.PHYSICAL,
    criticalMultiplier: 1.5,
  },
  attackSpeed: 1.2,
  range: 1.5,
  criticalChance: 0.1,
  effectiveness: new Map([
    [ActionType.COMBAT_MELEE, 3.0],
    [ActionType.CUT_MATERIAL, 1.5],
  ]),
};
```

## Integration Points

### With Inventory System

```typescript
interface ItemInventoryBridge {
  addItem(item: Item, quantity: number): boolean;
  removeItem(itemId: ItemId, quantity: number): boolean;
  findItems(predicate: (item: Item) => boolean): InventorySlot[];
  updateItemCondition(itemId: ItemId, newCondition: ItemCondition): void;
}
```

### With World Interaction

```typescript
class ItemWorldInteraction {
  useItemOnTarget(item: Item, target: WorldObject, player: Player): InteractionResult {
    // Determine interaction type
    const interaction = this.determineInteraction(item, target);

    if (!interaction) {
      return { success: false, reason: "Cannot use this item here" };
    }

    // Check if player meets requirements
    const requirements = this.checkRequirements(interaction, player);
    if (!requirements.met) {
      return { success: false, reason: requirements.reason };
    }

    // Execute the interaction
    const result = this.executeInteraction(interaction, item, target, player);

    // Apply item wear
    if (result.success && item.properties.durability) {
      this.durabilityManager.useItem(item, {
        action: interaction.action,
        intensity: interaction.intensity,
      });
    }

    return result;
  }
}
```

### With Trading System

```typescript
interface ItemTradeValue {
  calculateValue(item: Item): number;
  getMarketDemand(item: Item, location: TradingPost): number;
  applySupplyDemand(baseValue: number, supply: number, demand: number): number;
}

class ItemEconomy {
  calculateTradeValue(item: Item, market: Market): number {
    let baseValue = item.stats.value || 0;

    // Quality modifier
    const qualityMultiplier = this.getQualityValueMultiplier(item.properties.quality);
    baseValue *= qualityMultiplier;

    // Condition modifier (damaged items worth less)
    const conditionMultiplier = this.getConditionValueMultiplier(item.condition);
    baseValue *= conditionMultiplier;

    // Market supply/demand
    const marketMultiplier = market.getSupplyDemandMultiplier(item.type);
    baseValue *= marketMultiplier;

    // Rarity bonus
    const rarityBonus = this.getRarityValueBonus(item.properties.rarity);
    baseValue += rarityBonus;

    return Math.floor(baseValue);
  }
}
```

## Performance Considerations

### Item Pooling

```typescript
class ItemPool {
  private pools: Map<ItemType, Item[]> = new Map();

  acquire(itemType: ItemType): Item {
    const pool = this.pools.get(itemType) || [];
    const item = pool.pop();

    if (item) {
      this.resetItem(item);
      return item;
    }

    return this.itemFactory.createItem(itemType);
  }

  release(item: Item): void {
    const pool = this.pools.get(item.type) || [];
    pool.push(item);
    this.pools.set(item.type, pool);
  }
}
```

### Lazy Property Calculation

```typescript
class LazyItemProperties {
  private calculatedProperties: Map<ItemId, any> = new Map();

  getEffectiveness(item: Item, action: ActionType): number {
    const cacheKey = `${item.id}_${action}_effectiveness`;

    if (this.calculatedProperties.has(cacheKey)) {
      return this.calculatedProperties.get(cacheKey);
    }

    const effectiveness = this.calculateEffectiveness(item, action);
    this.calculatedProperties.set(cacheKey, effectiveness);

    return effectiveness;
  }

  invalidateCache(itemId: ItemId): void {
    for (const key of this.calculatedProperties.keys()) {
      if (key.startsWith(itemId)) {
        this.calculatedProperties.delete(key);
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests

- **Item Creation**: Test factory creates items with correct properties
- **Quality System**: Test quality modifiers affect stats correctly
- **Durability**: Test item wear and repair mechanics
- **Effectiveness**: Test tool effectiveness calculations

### Integration Tests

- **Crafting**: Test items can be crafted from materials correctly
- **Combat**: Test weapons integrate properly with combat system
- **World Interaction**: Test tools work with world objects
- **Economy**: Test item values calculated correctly

### Performance Tests

- **Item Creation**: Benchmark item generation performance
- **Property Calculation**: Test lazy loading performance benefits
- **Memory Usage**: Monitor item pooling effectiveness

## Success Metrics

- **Variety**: 100+ distinct item types with meaningful differences
- **Balance**: Tool effectiveness matches intended gameplay roles
- **Performance**: Item operations complete in <1ms average
- **Quality**: Quality system provides 20-50% performance range
- **Durability**: Items last appropriate time before needing repair/replacement
