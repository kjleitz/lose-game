# Resource Collection System Design

## Overview

The resource collection system manages how players gather materials from the environment through various harvesting, mining, and collection activities. It emphasizes realistic tool requirements, skill development, and sustainable resource management that connects meaningfully to the crafting and progression systems.

## Core Requirements

- **Tool-based harvesting**: Different tools provide access to different resources
- **Skill progression**: Player skills improve collection efficiency and unlock new resources
- **Resource regeneration**: Sustainable harvesting vs. depletion mechanics
- **Quality variation**: Collected resources have different qualities affecting their value
- **Environmental factors**: Weather, time of day, and location affect collection outcomes
- **Realistic resource distribution**: Resources appear where they would naturally occur

## Domain Model

### Resource Collection Framework

```typescript
interface ResourceSource {
  readonly id: ResourceSourceId;
  readonly type: ResourceSourceType;
  readonly position: Point;
  readonly resources: ResourceDeposit[];
  readonly harvestable: boolean;
  readonly regeneration?: RegenerationProperties;
  readonly requirements: HarvestRequirement[];
  readonly currentState: ResourceState;
}

enum ResourceSourceType {
  FLORA = "flora", // trees, plants, fungi
  FAUNA = "fauna", // animals (when hunted)
  MINERAL = "mineral", // ore deposits, stone outcrops
  LIQUID = "liquid", // water sources, oil seeps
  ARCHAEOLOGICAL = "archaeological", // ruins, artifacts
  ATMOSPHERIC = "atmospheric", // collecting gases, wind power
}

interface ResourceDeposit {
  readonly resourceType: ResourceType;
  readonly quantity: number;
  readonly quality: ResourceQuality;
  readonly accessibility: AccessibilityLevel;
  readonly extractionDifficulty: number; // 0-1 scale
  readonly toolRequirements: ToolRequirement[];
}

enum ResourceQuality {
  IMPURE = "impure", // 60% effective value
  STANDARD = "standard", // 100% baseline
  HIGH_GRADE = "high_grade", // 150% effective value
  PURE = "pure", // 200% effective value
  PRISTINE = "pristine", // 300% effective value
}

enum AccessibilityLevel {
  SURFACE = "surface", // easily accessible
  SHALLOW = "shallow", // requires light digging/cutting
  DEEP = "deep", // requires significant excavation
  HIDDEN = "hidden", // requires special tools/knowledge
  DANGEROUS = "dangerous", // environmental hazards present
}
```

### Collection Activities

```typescript
interface CollectionActivity {
  readonly id: ActivityId;
  readonly type: CollectionType;
  readonly source: ResourceSource;
  readonly tool: Item | null;
  readonly duration: number; // base time in seconds
  readonly energyCost: number; // player stamina required
  readonly skillRequirement: SkillRequirement[];
  readonly environmentalFactors: EnvironmentalFactor[];
}

enum CollectionType {
  HARVESTING = "harvesting", // gathering from living things
  MINING = "mining", // extracting from mineral deposits
  LOGGING = "logging", // cutting down trees
  FISHING = "fishing", // catching aquatic life
  HUNTING = "hunting", // taking resources from fauna
  FORAGING = "foraging", // gathering without tools
  EXCAVATING = "excavating", // archaeological digging
  TAPPING = "tapping", // extracting fluids (maple syrup, rubber)
}

interface CollectionResult {
  readonly success: boolean;
  readonly resources: CollectedResource[];
  readonly experience: Map<SkillType, number>;
  readonly durabilityLoss: number; // tool wear
  readonly energyConsumed: number;
  readonly timeSpent: number;
  readonly sideEffects?: CollectionSideEffect[];
}

interface CollectedResource {
  readonly type: ResourceType;
  readonly quantity: number;
  readonly quality: ResourceQuality;
  readonly condition: ItemCondition;
  readonly metadata: ResourceMetadata; // origin info for tracking
}
```

### Skill System Integration

```typescript
enum SkillType {
  FORESTRY = "forestry",
  MINING = "mining",
  HERBALISM = "herbalism",
  HUNTING = "hunting",
  FISHING = "fishing",
  ARCHAEOLOGY = "archaeology",
  GEOLOGY = "geology",
  BOTANY = "botany",
}

interface SkillBenefit {
  readonly skillType: SkillType;
  readonly level: number;
  readonly benefits: SkillBonus[];
}

interface SkillBonus {
  readonly type: BonusType;
  readonly value: number;
  readonly description: string;
}

enum BonusType {
  EFFICIENCY = "efficiency", // faster collection
  YIELD = "yield", // more resources per collection
  QUALITY = "quality", // better quality resources
  TOOL_PRESERVATION = "tool_preservation", // less tool wear
  RARE_FIND = "rare_find", // chance for rare resources
  ENERGY_EFFICIENCY = "energy_efficiency", // less stamina cost
  CRITICAL_SUCCESS = "critical_success", // chance for bonus outcomes
}
```

## System Architecture

### Domain Layer (`src/domain/game/collection/`)

```
collection/
├── ResourceSource.ts           # Resource-bearing objects in world
├── CollectionActivity.ts       # Collection action definitions
├── CollectionResult.ts         # Collection outcome processing
├── ResourceRegeneration.ts     # Resource renewal mechanics
├── SkillSystem.ts             # Collection skill management
├── types/                     # Collection type implementations
│   ├── HarvestingSystem.ts
│   ├── MiningSystem.ts
│   ├── LoggingSystem.ts
│   ├── FishingSystem.ts
│   ├── HuntingSystem.ts
│   └── ForagingSystem.ts
├── calculators/               # Collection outcome calculations
│   ├── YieldCalculator.ts
│   ├── QualityCalculator.ts
│   ├── TimeCalculator.ts
│   ├── SkillCalculator.ts
│   └── ToolEffectivenessCalculator.ts
└── services/
    ├── CollectionService.ts   # Main collection management
    ├── ResourceService.ts     # Resource tracking and spawning
    └── SkillService.ts        # Skill progression management
```

### Integration Layer (`src/domain/integration/`)

```
integration/
├── CollectionWorldBridge.ts   # Collection with world objects
├── CollectionInventoryBridge.ts # Collected items to inventory
├── CollectionCraftingBridge.ts # Resources for crafting
└── CollectionEconomyBridge.ts  # Resource trading values
```

## Implementation Details

### Collection Execution System

```typescript
class CollectionService {
  executeCollection(activity: CollectionActivity, player: Player): Promise<CollectionResult> {
    // 1. Validate collection attempt
    const validation = this.validateCollection(activity, player);
    if (!validation.valid) {
      return Promise.resolve({
        success: false,
        resources: [],
        reason: validation.reason,
      });
    }

    // 2. Calculate collection parameters
    const parameters = this.calculateCollectionParameters(activity, player);

    // 3. Check energy requirements
    if (player.energy < parameters.energyCost) {
      return Promise.resolve({
        success: false,
        resources: [],
        reason: "Not enough energy",
      });
    }

    // 4. Execute the collection over time
    return this.performTimedCollection(activity, player, parameters);
  }

  private calculateCollectionParameters(
    activity: CollectionActivity,
    player: Player,
  ): CollectionParameters {
    const baseTime = activity.duration;
    const baseEnergy = activity.energyCost;

    // Tool effectiveness
    const toolEffectiveness = activity.tool
      ? this.getToolEffectiveness(activity.tool, activity.type)
      : 1.0;

    // Skill bonuses
    const relevantSkill = this.getRelevantSkill(activity.type);
    const skillLevel = player.skills.get(relevantSkill) || 0;
    const skillBonus = this.calculateSkillBonus(skillLevel, activity.type);

    // Environmental factors
    const environmentModifier = this.calculateEnvironmentalModifier(activity.environmentalFactors);

    return {
      actualTime: Math.max(1, baseTime / (toolEffectiveness * skillBonus.efficiency)),
      energyCost: Math.max(1, baseEnergy / skillBonus.energyEfficiency),
      yieldMultiplier: toolEffectiveness * skillBonus.yield * environmentModifier.yield,
      qualityBonus: skillBonus.quality + environmentModifier.quality,
      criticalChance: skillBonus.criticalChance,
      toolWearMultiplier: 1.0 / (skillBonus.toolPreservation * toolEffectiveness),
    };
  }

  private async performTimedCollection(
    activity: CollectionActivity,
    player: Player,
    parameters: CollectionParameters,
  ): Promise<CollectionResult> {
    // Start collection animation/feedback
    this.startCollectionAnimation(activity, parameters.actualTime);

    // Wait for collection to complete (or be interrupted)
    await this.waitForCollectionCompletion(parameters.actualTime);

    // Calculate results
    const baseYield = this.calculateBaseYield(activity.source);
    const finalYield = this.applyYieldModifiers(baseYield, parameters);

    // Apply tool wear
    const durabilityLoss = activity.tool
      ? this.calculateToolWear(activity.tool, activity.type, parameters.toolWearMultiplier)
      : 0;

    // Generate collected resources
    const resources = this.generateCollectedResources(activity.source, finalYield, parameters);

    // Update resource source state
    this.updateResourceSource(activity.source, resources);

    // Grant experience
    const experience = this.calculateExperience(activity.type, resources, parameters.actualTime);

    // Consume player energy
    player.energy -= parameters.energyCost;

    return {
      success: true,
      resources,
      experience,
      durabilityLoss,
      energyConsumed: parameters.energyCost,
      timeSpent: parameters.actualTime,
    };
  }
}
```

### Resource Quality System

```typescript
class QualityCalculator {
  calculateResourceQuality(
    source: ResourceSource,
    tool: Item | null,
    skillLevel: number,
    environmentalFactors: EnvironmentalFactor[],
  ): ResourceQuality {
    let qualityScore = 0.5; // baseline score

    // Source natural quality
    const sourceQuality = this.getSourceBaseQuality(source);
    qualityScore += sourceQuality * 0.3;

    // Tool quality bonus
    if (tool) {
      const toolQuality = this.getToolQualityBonus(tool);
      qualityScore += toolQuality * 0.2;
    }

    // Skill level influence
    const skillBonus = Math.min(0.3, skillLevel * 0.01); // max 30% bonus at skill 30
    qualityScore += skillBonus;

    // Environmental factors
    const environmentBonus = this.calculateEnvironmentalQualityBonus(environmentalFactors);
    qualityScore += environmentBonus;

    // Random variation (±10%)
    const randomFactor = (Math.random() - 0.5) * 0.2;
    qualityScore += randomFactor;

    // Convert score to quality enum
    return this.scoreToQuality(Math.max(0, Math.min(1, qualityScore)));
  }

  private scoreToQuality(score: number): ResourceQuality {
    if (score < 0.2) return ResourceQuality.IMPURE;
    if (score < 0.5) return ResourceQuality.STANDARD;
    if (score < 0.8) return ResourceQuality.HIGH_GRADE;
    if (score < 0.95) return ResourceQuality.PURE;
    return ResourceQuality.PRISTINE;
  }
}
```

### Resource Regeneration System

```typescript
class ResourceRegeneration {
  updateRegeneration(dt: number): void {
    for (const source of this.getAllResourceSources()) {
      if (source.regeneration) {
        this.updateSourceRegeneration(source, dt);
      }
    }
  }

  private updateSourceRegeneration(source: ResourceSource, dt: number): void {
    const regen = source.regeneration!;

    switch (regen.type) {
      case RegenerationType.FIXED_RATE:
        this.updateFixedRateRegeneration(source, dt);
        break;
      case RegenerationType.SEASONAL:
        this.updateSeasonalRegeneration(source, dt);
        break;
      case RegenerationType.CONDITIONAL:
        this.updateConditionalRegeneration(source, dt);
        break;
      case RegenerationType.ONE_TIME:
        // No regeneration after initial harvest
        break;
    }
  }

  private updateFixedRateRegeneration(source: ResourceSource, dt: number): void {
    const regen = source.regeneration!;

    for (const deposit of source.resources) {
      if (deposit.quantity < deposit.maxQuantity) {
        const regenAmount = regen.rate * dt;
        const newQuantity = Math.min(deposit.maxQuantity, deposit.quantity + regenAmount);

        deposit.quantity = newQuantity;
      }
    }
  }

  private updateSeasonalRegeneration(source: ResourceSource, dt: number): void {
    const currentSeason = this.getCurrentSeason();
    const regen = source.regeneration!;

    // Only regenerate during specific seasons
    if (regen.seasons && !regen.seasons.includes(currentSeason)) {
      return;
    }

    // Higher regeneration rate during favorable seasons
    const seasonalMultiplier = this.getSeasonalRegenMultiplier(currentSeason, regen);
    const effectiveRate = regen.rate * seasonalMultiplier;

    this.applyRegeneration(source, effectiveRate * dt);
  }
}
```

### Skill-Based Collection Bonuses

```typescript
class SkillBonusCalculator {
  calculateSkillBonus(skillLevel: number, collectionType: CollectionType): SkillBonus {
    const bonuses = {
      efficiency: 1.0,
      yield: 1.0,
      quality: 0.0,
      energyEfficiency: 1.0,
      toolPreservation: 1.0,
      criticalChance: 0.0,
    };

    // Each skill level provides small bonuses
    const levelMultiplier = skillLevel / 100; // normalize to 0-1

    switch (collectionType) {
      case CollectionType.MINING:
        bonuses.efficiency = 1.0 + levelMultiplier * 0.5; // up to 50% faster
        bonuses.yield = 1.0 + levelMultiplier * 0.3; // up to 30% more resources
        bonuses.quality = levelMultiplier * 0.2; // up to 20% quality bonus
        bonuses.toolPreservation = 1.0 + levelMultiplier * 0.4; // tools last 40% longer
        break;

      case CollectionType.HARVESTING:
        bonuses.efficiency = 1.0 + levelMultiplier * 0.4;
        bonuses.yield = 1.0 + levelMultiplier * 0.4; // herbalism focuses on yield
        bonuses.quality = levelMultiplier * 0.25;
        bonuses.criticalChance = levelMultiplier * 0.1; // 10% crit chance at max
        break;

      case CollectionType.LOGGING:
        bonuses.efficiency = 1.0 + levelMultiplier * 0.6; // forestry focuses on speed
        bonuses.yield = 1.0 + levelMultiplier * 0.2;
        bonuses.energyEfficiency = 1.0 + levelMultiplier * 0.3;
        bonuses.toolPreservation = 1.0 + levelMultiplier * 0.5;
        break;
    }

    // Diminishing returns at higher levels
    Object.keys(bonuses).forEach((key) => {
      if (key !== "quality" && key !== "criticalChance") {
        bonuses[key] = 1.0 + Math.pow(bonuses[key] - 1.0, 0.8);
      } else {
        bonuses[key] = bonuses[key] * Math.pow(levelMultiplier, 0.8);
      }
    });

    return bonuses;
  }
}
```

## Collection Type Implementations

### Mining System

```typescript
class MiningSystem {
  executeMining(deposit: MineralDeposit, tool: Tool, player: Player): Promise<CollectionResult> {
    // Validate tool is suitable for mining
    if (!this.isMiningTool(tool)) {
      return Promise.resolve({
        success: false,
        resources: [],
        reason: "Wrong tool for mining",
      });
    }

    // Calculate mining parameters
    const hardness = deposit.hardness; // 0-1, harder = slower/more tool wear
    const toolEffectiveness = this.getMiningEffectiveness(tool, deposit.mineralType);
    const skillLevel = player.skills.get(SkillType.MINING) || 0;

    // Base mining time affected by hardness and tool
    const baseTime = 5 + hardness * 10; // 5-15 seconds base
    const actualTime = baseTime / (toolEffectiveness * (1 + skillLevel * 0.02));

    // Tool wear based on hardness
    const toolWear = hardness * (2 - toolEffectiveness); // harder materials wear tools more

    return this.performTimedCollection({
      duration: actualTime,
      energyCost: 15 + hardness * 10,
      toolWear,
      yieldCalculator: () => this.calculateMiningYield(deposit, tool, skillLevel),
    });
  }

  private calculateMiningYield(
    deposit: MineralDeposit,
    tool: Tool,
    skillLevel: number,
  ): CollectedResource[] {
    const baseYield = deposit.baseYield;
    const toolMultiplier = this.getMiningToolMultiplier(tool);
    const skillMultiplier = 1.0 + skillLevel * 0.01; // 1% per skill level

    const primaryYield = Math.floor(baseYield * toolMultiplier * skillMultiplier);
    const resources: CollectedResource[] = [
      {
        type: deposit.primaryResource,
        quantity: primaryYield,
        quality: this.calculateQuality(deposit, tool, skillLevel),
        condition: ItemCondition.PRISTINE,
      },
    ];

    // Chance for secondary resources (rare metals, gems)
    for (const secondary of deposit.secondaryResources) {
      const chance = secondary.baseChance * toolMultiplier * (1 + skillLevel * 0.005);
      if (Math.random() < chance) {
        resources.push({
          type: secondary.resourceType,
          quantity: Math.floor(Math.random() * secondary.maxQuantity) + 1,
          quality: this.calculateQuality(deposit, tool, skillLevel),
          condition: ItemCondition.PRISTINE,
        });
      }
    }

    return resources;
  }
}
```

### Forestry System

```typescript
class LoggingSystem {
  executeTreeFelling(tree: TreeInstance, tool: Tool, player: Player): Promise<CollectionResult> {
    if (!this.isChoppingTool(tool)) {
      return Promise.resolve({
        success: false,
        resources: [],
        reason: "Need an axe or similar tool",
      });
    }

    // Tree size affects cutting time and yield
    const treeSize = tree.radius;
    const woodHardness = tree.species.woodHardness; // different wood types

    const baseCutTime = 3 + treeSize * 2 + woodHardness * 5;
    const toolEffectiveness = this.getChoppingEffectiveness(tool);
    const skillLevel = player.skills.get(SkillType.FORESTRY) || 0;

    const actualTime = baseCutTime / (toolEffectiveness * (1 + skillLevel * 0.03));

    // Calculate wood yield based on tree properties
    const woodYield = Math.floor(
      treeSize *
        2 * // bigger trees = more wood
        tree.species.woodDensity * // denser wood = more material
        (1 + skillLevel * 0.02) * // skill improves yield
        toolEffectiveness, // better tools = less waste
    );

    return this.performTreeCutting({
      tree,
      duration: actualTime,
      energyCost: 10 + treeSize * 3,
      woodYield,
      toolWear: woodHardness * (2 - toolEffectiveness),
    });
  }

  private async performTreeCutting(params: TreeCuttingParams): Promise<CollectionResult> {
    // Animated tree cutting with multiple chops
    const chopsNeeded = Math.ceil(params.duration / 2); // 2 seconds per chop

    for (let i = 0; i < chopsNeeded; i++) {
      await this.performChop(params.tree);

      // Visual feedback (tree shaking, chips flying)
      this.showChoppingEffects(params.tree);

      // Check if player cancels
      if (this.wasCancelled()) {
        return this.createCancelledResult();
      }
    }

    // Tree falls down with animation
    await this.animateTreeFalling(params.tree);

    // Generate wood resources with realistic distribution
    const resources = this.generateWoodResources(params.tree, params.woodYield);

    // Remove tree from world
    this.removeTreeFromWorld(params.tree);

    return {
      success: true,
      resources,
      experience: new Map([[SkillType.FORESTRY, params.duration * 0.5]]),
      durabilityLoss: params.toolWear,
      energyConsumed: params.energyCost,
      timeSpent: params.duration,
    };
  }
}
```

## Integration Points

### With Crafting System

```typescript
interface CollectionCraftingBridge {
  getAvailableResources(): Map<ResourceType, ResourceAvailability>;
  reserveResources(recipe: CraftingRecipe): ReservationResult;
  consumeReservedResources(reservationId: ReservationId): boolean;
}

class ResourceReservationSystem {
  private reservations: Map<ReservationId, ResourceReservation> = new Map();

  reserveResources(resources: Map<ResourceType, number>, duration: number): ReservationResult {
    const reservationId = this.generateReservationId();

    // Check if resources are available
    for (const [resourceType, quantity] of resources) {
      const available = this.getAvailableQuantity(resourceType);
      if (available < quantity) {
        return {
          success: false,
          reason: `Not enough ${resourceType}: need ${quantity}, have ${available}`,
        };
      }
    }

    // Create reservation
    const reservation: ResourceReservation = {
      id: reservationId,
      resources: new Map(resources),
      expiresAt: Date.now() + duration * 1000,
      status: ReservationStatus.ACTIVE,
    };

    this.reservations.set(reservationId, reservation);

    return { success: true, reservationId };
  }
}
```

### With Economy System

```typescript
class ResourceMarketValue {
  calculateMarketValue(resource: CollectedResource, market: Market): number {
    let baseValue = this.getBaseValue(resource.type);

    // Quality modifier
    const qualityMultiplier = this.getQualityMultiplier(resource.quality);
    baseValue *= qualityMultiplier;

    // Market supply/demand
    const supplyDemand = market.getSupplyDemandRatio(resource.type);
    baseValue *= supplyDemand;

    // Resource condition (freshness for perishables)
    const conditionMultiplier = this.getConditionMultiplier(resource.condition);
    baseValue *= conditionMultiplier;

    // Origin bonus (some locations produce premium resources)
    const originBonus = this.getOriginBonus(resource.metadata.origin);
    baseValue += originBonus;

    return Math.max(1, Math.floor(baseValue));
  }
}
```

## Performance Considerations

### Resource Source Streaming

```typescript
class ResourceSourceStreamer {
  private loadedSources: Map<ChunkId, ResourceSource[]> = new Map();

  updatePlayerPosition(playerPos: Point): void {
    const currentChunk = this.worldToChunk(playerPos);
    const requiredChunks = this.getRequiredChunks(currentChunk, 2); // 2 chunk radius

    // Load new resource sources
    for (const chunkId of requiredChunks) {
      if (!this.loadedSources.has(chunkId)) {
        const sources = this.generateResourceSources(chunkId);
        this.loadedSources.set(chunkId, sources);
      }
    }

    // Unload distant resource sources
    for (const [chunkId, sources] of this.loadedSources) {
      if (!requiredChunks.has(chunkId)) {
        this.saveResourceSources(chunkId, sources);
        this.loadedSources.delete(chunkId);
      }
    }
  }
}
```

### Collection Animation Optimization

```typescript
class CollectionAnimationManager {
  private activeCollections: Map<PlayerId, CollectionAnimation> = new Map();

  startCollection(playerId: PlayerId, activity: CollectionActivity): void {
    const animation = new CollectionAnimation(activity);
    this.activeCollections.set(playerId, animation);

    // Use efficient particle systems for visual feedback
    this.particleSystem.startCollectionParticles(activity);
  }

  updateAnimations(dt: number): void {
    for (const [playerId, animation] of this.activeCollections) {
      animation.update(dt);

      if (animation.isComplete()) {
        this.completeCollection(playerId);
        this.activeCollections.delete(playerId);
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests

- **Yield Calculation**: Test resource yield calculations with various modifiers
- **Quality System**: Verify quality calculation considers all factors correctly
- **Skill Bonuses**: Test skill level bonuses apply appropriate multipliers
- **Tool Effectiveness**: Verify tool bonuses work for different collection types

### Integration Tests

- **Resource Regeneration**: Test resource sources regenerate over time correctly
- **Inventory Integration**: Test collected resources properly add to inventory
- **Skill Progression**: Test experience gain and skill level improvements
- **Cross-System**: Test collection integrates with crafting and economy

### Performance Tests

- **Large Scale Collection**: Test system performance with many simultaneous collections
- **Resource Source Streaming**: Benchmark resource loading/unloading performance
- **Animation Performance**: Test collection animations don't impact frame rate

## Success Metrics

- **Realism**: Resource collection feels authentic and skill-based
- **Balance**: Collection rates support intended game progression
- **Performance**: Maintain 60fps during collection activities
- **Engagement**: Players find collection activities satisfying and rewarding
- **Sustainability**: Resource regeneration balances collection rates appropriately
