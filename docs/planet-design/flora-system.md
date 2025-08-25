# Flora System Design

## Overview

The flora system creates diverse, living plant ecosystems across planet surfaces. Plants grow, reproduce, respond to environmental conditions, and provide resources when harvested. The system emphasizes ecological realism, visual variety, and meaningful resource management.

## Core Requirements

- **Living ecosystems**: Plants grow, spread, and die naturally over time
- **Environmental adaptation**: Flora responds to terrain, climate, and seasons
- **Harvestable resources**: Wood, fibers, food, medicines from different plant species
- **Tool-based interaction**: Different tools provide better yields and access
- **Visual diversity**: Distinct appearances and animations for each species
- **Ecological relationships**: Plants compete for space and nutrients

## Domain Model

### Flora Species

```typescript
enum FloraCategory {
  TREE = "tree",
  BUSH = "bush",
  GRASS = "grass",
  FLOWER = "flower",
  VINE = "vine",
  MUSHROOM = "mushroom",
  CROP = "crop",
  AQUATIC = "aquatic",
}

interface FloraSpecies {
  readonly id: SpeciesId;
  readonly name: string;
  readonly category: FloraCategory;
  readonly size: FloraSize;
  readonly growth: GrowthProperties;
  readonly habitat: HabitatRequirements;
  readonly harvest: HarvestProperties;
  readonly appearance: VisualProperties;
  readonly ecology: EcologicalProperties;
}

interface GrowthProperties {
  readonly maxAge: number; // in game days
  readonly growthRate: number; // growth per day
  readonly reproductionAge: number; // when it can spread/seed
  readonly reproductionRate: number; // chance per day
  readonly maxRadius: number; // how far it can spread
  readonly seasonal: boolean; // dies in winter
}

interface HabitatRequirements {
  readonly terrainTypes: TerrainType[];
  readonly minMoisture: number;
  readonly maxMoisture: number;
  readonly minTemperature: number;
  readonly maxTemperature: number;
  readonly minElevation: number;
  readonly maxElevation: number;
  readonly lightRequirement: LightLevel;
  readonly soilType: SoilType[];
}

interface HarvestProperties {
  readonly primaryResource: ItemType;
  readonly secondaryResources: ResourceDrop[];
  readonly toolRequirements: ToolRequirement[];
  readonly harvestTime: number; // seconds to harvest
  readonly regrowth: RegrowthProperties;
  readonly harvestDamage: number; // damage dealt when harvested
}
```

### Flora Instances

```typescript
class FloraInstance extends DamageableEntity {
  readonly species: FloraSpecies;
  readonly age: number; // in game days
  readonly growthStage: GrowthStage;
  readonly health: number;
  readonly nutrients: number; // affects growth and yield
  readonly lastReproduction: number;
  readonly seedRadius: number; // current spreading range

  constructor(species: FloraSpecies, position: Point) {
    super();
    this.species = species;
    this.age = 0;
    this.growthStage = GrowthStage.SEEDLING;
    this.health = species.baseHealth;
    this.nutrients = 1.0;
  }

  update(dt: number, environment: Environment): void {
    this.grow(dt, environment);
    this.checkReproduction(environment);
    this.updateHealth(environment);
  }
}

enum GrowthStage {
  SEED = "seed",
  SEEDLING = "seedling",
  JUVENILE = "juvenile",
  MATURE = "mature",
  ANCIENT = "ancient",
  DYING = "dying",
}
```

### Ecological Systems

```typescript
interface Environment {
  readonly terrain: TerrainCell;
  readonly season: Season;
  readonly dayTime: number; // 0-1, affects photosynthesis
  readonly rainfall: number; // recent rainfall affecting moisture
  readonly temperature: number; // current temperature
  readonly soilNutrients: number; // local soil richness
  readonly competition: FloraInstance[]; // nearby plants competing for resources
}

interface EcologicalProperties {
  readonly competitiveStrength: number; // ability to outcompete other plants
  readonly alleloPathy: boolean; // inhibits other plant growth
  readonly nitrogen_fixing: boolean; // improves soil for other plants
  readonly pollinator_attractant: boolean; // helps other plants reproduce
  readonly invasive: boolean; // spreads aggressively
  readonly pioneer: boolean; // first to colonize disturbed areas
}
```

## System Architecture

### Domain Layer (`src/domain/game/flora/`)

```
flora/
├── FloraSpecies.ts         # Species definitions and properties
├── FloraInstance.ts        # Individual plant instances
├── FloraGrowth.ts          # Growth and aging mechanics
├── FloraReproduction.ts    # Seeding and spreading logic
├── FloraEcology.ts         # Environmental interactions
├── FloraHarvesting.ts      # Resource extraction mechanics
├── species/                # Individual species definitions
│   ├── Trees.ts
│   ├── Bushes.ts
│   ├── Grasses.ts
│   ├── Flowers.ts
│   └── Mushrooms.ts
└── services/
    ├── FloraService.ts     # Flora management and queries
    ├── GrowthService.ts    # Growth calculations
    └── EcologyService.ts   # Environmental interactions
```

### Rendering Layer (`src/domain/render/flora/`)

```
flora/
├── FloraRenderer.ts        # Master flora rendering
├── TreeRenderer.ts         # Tree-specific rendering
├── BushRenderer.ts         # Bush and shrub rendering
├── GrassRenderer.ts        # Grass field rendering
├── FlowerRenderer.ts       # Individual flower rendering
├── GrowthAnimator.ts       # Growth stage transitions
└── SeasonalRenderer.ts     # Seasonal appearance changes
```

## Implementation Details

### Growth System

```typescript
class FloraGrowth {
  updateGrowth(flora: FloraInstance, environment: Environment, dt: number): void {
    // Calculate growth rate based on environmental factors
    const baseGrowthRate = flora.species.growth.growthRate;
    const environmentalMultiplier = this.calculateEnvironmentalMultiplier(flora, environment);
    const competitionPenalty = this.calculateCompetitionPenalty(flora, environment.competition);

    const actualGrowthRate = baseGrowthRate * environmentalMultiplier * competitionPenalty;

    // Age the plant
    flora.age += dt * actualGrowthRate;

    // Update growth stage
    this.updateGrowthStage(flora);

    // Update size and health based on nutrients
    this.updatePhysicalProperties(flora, environment);

    // Check for death from old age or poor conditions
    this.checkMortality(flora, environment);
  }

  private calculateEnvironmentalMultiplier(flora: FloraInstance, env: Environment): number {
    let multiplier = 1.0;

    // Moisture factor
    const moistureOptimal =
      (flora.species.habitat.minMoisture + flora.species.habitat.maxMoisture) / 2;
    const moistureDelta = Math.abs(env.terrain.moisture - moistureOptimal);
    multiplier *= Math.max(0.1, 1.0 - moistureDelta);

    // Temperature factor
    const tempOptimal =
      (flora.species.habitat.minTemperature + flora.species.habitat.maxTemperature) / 2;
    const tempDelta = Math.abs(env.temperature - tempOptimal);
    multiplier *= Math.max(0.1, 1.0 - tempDelta);

    // Light factor
    multiplier *= this.getLightMultiplier(flora.species.habitat.lightRequirement, env.dayTime);

    // Seasonal factor
    if (flora.species.growth.seasonal) {
      multiplier *= this.getSeasonalMultiplier(env.season);
    }

    return multiplier;
  }
}
```

### Reproduction System

```typescript
class FloraReproduction {
  attemptReproduction(parent: FloraInstance, environment: Environment): FloraInstance[] {
    const newSeedlings: FloraInstance[] = [];

    // Check if plant is old enough and healthy enough to reproduce
    if (parent.age < parent.species.growth.reproductionAge) return newSeedlings;
    if (parent.health < parent.species.baseHealth * 0.5) return newSeedlings;

    // Calculate reproduction probability
    const baseRate = parent.species.growth.reproductionRate;
    const environmentRate = this.getEnvironmentalReproductionRate(parent, environment);
    const reproductionChance = baseRate * environmentRate;

    if (Math.random() > reproductionChance) return newSeedlings;

    // Generate seeds within spreading radius
    const seedCount = this.calculateSeedCount(parent);
    for (let i = 0; i < seedCount; i++) {
      const seedPosition = this.findSeedPosition(parent, environment);
      if (seedPosition) {
        const seedling = new FloraInstance(parent.species, seedPosition);
        seedling.nutrients = parent.nutrients * 0.3; // inherit some nutrients
        newSeedlings.push(seedling);
      }
    }

    // Update parent's last reproduction time
    parent.lastReproduction = Date.now();

    return newSeedlings;
  }

  private findSeedPosition(parent: FloraInstance, environment: Environment): Point | null {
    const maxRadius = parent.species.growth.maxRadius;
    const attempts = 10;

    for (let i = 0; i < attempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * maxRadius;
      const position = {
        x: parent.position.x + Math.cos(angle) * distance,
        y: parent.position.y + Math.sin(angle) * distance,
      };

      // Check if position is suitable for this species
      if (this.isSuitableHabitat(parent.species, position, environment)) {
        // Check for overcrowding
        if (!this.isOvercrowded(position, environment.competition)) {
          return position;
        }
      }
    }

    return null; // couldn't find suitable position
  }
}
```

### Harvesting System

```typescript
class FloraHarvesting {
  harvestFlora(flora: FloraInstance, tool: ItemType | null, player: Player): HarvestResult {
    // Check if flora can be harvested
    if (!this.canHarvest(flora)) {
      return { success: false, reason: "Cannot harvest this plant" };
    }

    // Determine tool effectiveness
    const toolEffectiveness = this.getToolEffectiveness(tool, flora);
    const harvestTime = flora.species.harvest.harvestTime / toolEffectiveness;

    // Calculate yield based on plant health, age, and tool
    const baseYield = this.calculateBaseYield(flora);
    const toolBonus = toolEffectiveness - 1.0; // bonus above 1.0
    const finalYield = Math.floor(baseYield * (1 + toolBonus));

    // Generate resource drops
    const drops = this.generateHarvestDrops(flora, finalYield, tool);

    // Apply damage to plant or destroy it
    const damage = flora.species.harvest.harvestDamage;
    if (damage >= flora.health) {
      this.destroyFlora(flora);
    } else {
      flora.health -= damage;
      this.scheduleRegrowth(flora);
    }

    return {
      success: true,
      drops,
      harvestTime,
      experience: this.calculateExperience(flora, tool),
    };
  }

  private generateHarvestDrops(
    flora: FloraInstance,
    multiplier: number,
    tool: ItemType | null,
  ): ItemDrop[] {
    const drops: ItemDrop[] = [];

    // Primary resource (always drops)
    const primaryAmount = Math.max(
      1,
      Math.floor(flora.species.harvest.primaryResource.baseAmount * multiplier),
    );
    drops.push({
      itemType: flora.species.harvest.primaryResource.type,
      quantity: primaryAmount,
      quality: this.calculateQuality(flora),
    });

    // Secondary resources (chance-based)
    for (const secondary of flora.species.harvest.secondaryResources) {
      if (Math.random() < secondary.probability * multiplier) {
        drops.push({
          itemType: secondary.type,
          quantity: Math.floor(secondary.amount * multiplier),
          quality: this.calculateQuality(flora),
        });
      }
    }

    // Tool-specific bonuses
    if (tool) {
      const bonusDrops = this.getToolBonusDrops(flora, tool);
      drops.push(...bonusDrops);
    }

    return drops;
  }
}
```

## Species Examples

### Oak Tree

```typescript
const OAK_TREE: FloraSpecies = {
  id: "oak_tree",
  name: "Oak Tree",
  category: FloraCategory.TREE,
  size: { minRadius: 3, maxRadius: 8, height: 12 },
  growth: {
    maxAge: 200, // 200 game days to full maturity
    growthRate: 0.8,
    reproductionAge: 50,
    reproductionRate: 0.1, // 10% chance per day when mature
    maxRadius: 20, // acorns can spread 20 units
    seasonal: false,
  },
  habitat: {
    terrainTypes: [TerrainType.GRASS, TerrainType.FOREST],
    minMoisture: 0.3,
    maxMoisture: 0.8,
    minTemperature: 0.2,
    maxTemperature: 0.9,
    lightRequirement: LightLevel.PARTIAL,
    soilType: [SoilType.LOAM, SoilType.CLAY],
  },
  harvest: {
    primaryResource: { type: "hardwood", baseAmount: 8 },
    secondaryResources: [
      { type: "bark", amount: 2, probability: 0.8 },
      { type: "acorns", amount: 5, probability: 0.6 },
    ],
    toolRequirements: [
      { tool: "axe", effectiveness: 2.0 },
      { tool: "chainsaw", effectiveness: 3.0 },
    ],
    harvestTime: 15, // 15 seconds with bare hands
    regrowth: null, // trees don't regrow when cut down
  },
};
```

### Berry Bush

```typescript
const BERRY_BUSH: FloraSpecies = {
  id: "berry_bush",
  name: "Berry Bush",
  category: FloraCategory.BUSH,
  size: { minRadius: 1, maxRadius: 2, height: 1.5 },
  growth: {
    maxAge: 30,
    growthRate: 1.5,
    reproductionAge: 15,
    reproductionRate: 0.2,
    maxRadius: 10,
    seasonal: true, // produces berries seasonally
  },
  habitat: {
    terrainTypes: [TerrainType.GRASS, TerrainType.FOREST],
    minMoisture: 0.4,
    maxMoisture: 1.0,
    minTemperature: 0.3,
    maxTemperature: 0.8,
    lightRequirement: LightLevel.PARTIAL,
    soilType: [SoilType.LOAM, SoilType.SANDY],
  },
  harvest: {
    primaryResource: { type: "berries", baseAmount: 3 },
    secondaryResources: [
      { type: "twigs", amount: 2, probability: 0.5 },
      { type: "leaves", amount: 1, probability: 0.3 },
    ],
    toolRequirements: [],
    harvestTime: 3, // quick to harvest berries
    regrowth: {
      time: 7, // regrows berries in 7 days
      stages: ["harvested", "budding", "flowering", "fruiting"],
    },
  },
};
```

### Medicinal Herb

```typescript
const HEALING_HERB: FloraSpecies = {
  id: "healing_herb",
  name: "Healing Herb",
  category: FloraCategory.FLOWER,
  size: { minRadius: 0.3, maxRadius: 0.5, height: 0.4 },
  growth: {
    maxAge: 15,
    growthRate: 2.0,
    reproductionAge: 8,
    reproductionRate: 0.3,
    maxRadius: 5,
    seasonal: true,
  },
  habitat: {
    terrainTypes: [TerrainType.GRASS],
    minMoisture: 0.6,
    maxMoisture: 0.9,
    minTemperature: 0.4,
    maxTemperature: 0.7,
    lightRequirement: LightLevel.FULL,
    soilType: [SoilType.LOAM],
  },
  harvest: {
    primaryResource: { type: "healing_herb", baseAmount: 1 },
    secondaryResources: [{ type: "herb_seeds", amount: 2, probability: 0.4 }],
    toolRequirements: [{ tool: "herbalist_knife", effectiveness: 1.5 }],
    harvestTime: 2,
    regrowth: {
      time: 14,
      stages: ["harvested", "sprouting", "growing", "flowering"],
    },
  },
};
```

## Integration Points

### With Terrain System

```typescript
class FloraDistribution {
  generateFloraForChunk(chunk: TerrainChunk): FloraInstance[] {
    const flora: FloraInstance[] = [];

    for (let x = 0; x < chunk.size; x++) {
      for (let y = 0; y < chunk.size; y++) {
        const cell = chunk.cells[y][x];
        const suitableSpecies = this.getSuitableSpecies(cell);

        for (const species of suitableSpecies) {
          const density = this.calculateDensity(species, cell);
          if (Math.random() < density) {
            const position = { x: chunk.x * chunk.size + x, y: chunk.y * chunk.size + y };
            flora.push(new FloraInstance(species, position));
          }
        }
      }
    }

    return flora;
  }
}
```

### With Item System

```typescript
interface HarvestResult {
  readonly success: boolean;
  readonly drops: ItemDrop[];
  readonly harvestTime: number;
  readonly experience: number;
  readonly reason?: string;
}

interface ItemDrop {
  readonly itemType: ItemType;
  readonly quantity: number;
  readonly quality: ItemQuality; // affects value and effectiveness
  readonly freshness?: number; // for perishable items
}
```

### With Player Skills

```typescript
enum SkillType {
  FORESTRY = "forestry",
  HERBALISM = "herbalism",
  FARMING = "farming",
  BOTANY = "botany",
}

class SkillSystem {
  getHarvestBonus(player: Player, flora: FloraInstance): number {
    const relevantSkill = this.getRelevantSkill(flora.species);
    const skillLevel = player.skills.get(relevantSkill) || 0;

    // Higher skill = better yields and rare drops
    return 1.0 + skillLevel * 0.1;
  }
}
```

## Performance Considerations

### Spatial Partitioning

```typescript
class FloraSpatialIndex {
  private grid: Map<string, FloraInstance[]> = new Map();
  private cellSize = 32; // grid cell size

  insert(flora: FloraInstance): void {
    const cellKey = this.getCellKey(flora.position);
    const cell = this.grid.get(cellKey) || [];
    cell.push(flora);
    this.grid.set(cellKey, cell);
  }

  getFloraInRadius(center: Point, radius: number): FloraInstance[] {
    const flora: FloraInstance[] = [];
    const minCell = this.getCellKey({ x: center.x - radius, y: center.y - radius });
    const maxCell = this.getCellKey({ x: center.x + radius, y: center.y + radius });

    // Check all cells in bounding box
    for (let x = minCell.x; x <= maxCell.x; x++) {
      for (let y = minCell.y; y <= maxCell.y; y++) {
        const cell = this.grid.get(`${x},${y}`) || [];
        flora.push(...cell.filter((f) => this.distance(f.position, center) <= radius));
      }
    }

    return flora;
  }
}
```

### Level of Detail

```typescript
class FloraLOD {
  updateFloraLOD(flora: FloraInstance[], cameraDistance: number): void {
    for (const plant of flora) {
      if (cameraDistance < 50) {
        plant.lodLevel = LODLevel.FULL; // full detail, growth animations
      } else if (cameraDistance < 200) {
        plant.lodLevel = LODLevel.MEDIUM; // basic sprite, no animations
      } else {
        plant.lodLevel = LODLevel.LOW; // simple colored rectangle
      }
    }
  }
}
```

## Testing Strategy

### Unit Tests

- **Growth Calculations**: Test environmental factors affect growth correctly
- **Reproduction Logic**: Verify seeding mechanics work with habitat requirements
- **Harvest Yields**: Test tool bonuses and quality calculations
- **Species Definitions**: Validate all species have complete, valid properties

### Integration Tests

- **Ecological Interactions**: Test competition and cooperation between species
- **Seasonal Cycles**: Verify plants respond correctly to seasonal changes
- **Tool Integration**: Test harvesting with different tools produces expected results
- **Performance**: Benchmark large flora populations for acceptable frame rates

### Gameplay Tests

- **Resource Balance**: Ensure flora provides meaningful but balanced resources
- **Visual Variety**: Confirm different biomes have distinct flora compositions
- **Player Progression**: Test that flora harvesting supports player advancement

## Success Metrics

- **Ecological Realism**: Different biomes have appropriate flora distributions
- **Performance**: Maintain 60fps with 1000+ flora instances visible
- **Resource Economy**: Flora provides 40% of player's crafting materials
- **Visual Appeal**: Players can identify at least 10 distinct plant species
- **Gameplay Integration**: Harvesting flora feels rewarding and necessary for progression
