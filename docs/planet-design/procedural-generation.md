# Procedural Planet Generation Design

## Overview

The procedural generation system creates infinite, diverse planet surfaces that emerge dynamically as the player explores. The system coordinates terrain generation, flora distribution, fauna spawning, and resource placement to create coherent, realistic ecosystems that feel hand-crafted while being entirely algorithmic.

## Core Requirements

- **Infinite worlds**: Planets generate seamlessly as player explores in any direction
- **Coherent ecosystems**: Flora, fauna, and terrain work together realistically
- **Performance optimization**: Generate only what's needed, when it's needed
- **Deterministic results**: Same seed produces identical worlds for multiplayer/saves
- **Biome transitions**: Smooth blending between different ecosystem types
- **Resource distribution**: Meaningful placement of harvestable resources

## Domain Model

### Generation Pipeline

```typescript
interface GenerationPipeline {
  readonly seed: number;
  readonly planetConfig: PlanetConfiguration;
  readonly stages: GenerationStage[];
  readonly chunkSize: number;
  readonly generationRadius: number; // chunks around player to keep loaded
}

interface PlanetConfiguration {
  readonly size: PlanetSize;
  readonly climateConfig: ClimateConfiguration;
  readonly terrainConfig: TerrainConfiguration;
  readonly biomeConfig: BiomeConfiguration;
  readonly floraConfig: FloraConfiguration;
  readonly faunaConfig: FaunaConfiguration;
  readonly resourceConfig: ResourceConfiguration;
}

enum GenerationStage {
  TERRAIN_HEIGHTMAP = "terrain_heightmap",
  CLIMATE_SIMULATION = "climate_simulation",
  BIOME_ASSIGNMENT = "biome_assignment",
  WATER_PLACEMENT = "water_placement",
  FLORA_DISTRIBUTION = "flora_distribution",
  FAUNA_SPAWNING = "fauna_spawning",
  RESOURCE_PLACEMENT = "resource_placement",
  STRUCTURE_PLACEMENT = "structure_placement", // ruins, caves, etc.
}
```

### Chunk-Based Generation

```typescript
interface GenerationChunk {
  readonly id: ChunkId;
  readonly worldX: number;
  readonly worldY: number;
  readonly size: number;
  readonly generationLevel: GenerationLevel;
  readonly dependencies: ChunkId[]; // neighboring chunks needed for generation
  readonly data: ChunkData;
}

enum GenerationLevel {
  UNGENERATED = 0,
  TERRAIN = 1,
  CLIMATE = 2,
  BIOMES = 3,
  FLORA = 4,
  FAUNA = 5,
  RESOURCES = 6,
  COMPLETE = 7,
}

interface ChunkData {
  terrain?: TerrainChunk;
  climate?: ClimateData;
  biomes?: BiomeData;
  flora?: FloraInstance[];
  fauna?: CreatureInstance[];
  resources?: ResourceDeposit[];
  structures?: Structure[];
}
```

### Noise-Based Generation

```typescript
interface NoiseConfiguration {
  readonly octaves: number;
  readonly frequency: number;
  readonly amplitude: number;
  readonly persistence: number;
  readonly lacunarity: number;
  readonly offset: Point;
  readonly noiseType: NoiseType;
}

enum NoiseType {
  SIMPLEX = "simplex",
  PERLIN = "perlin",
  RIDGED = "ridged",
  BILLOW = "billow",
  VORONOI = "voronoi",
}

class NoiseGenerator {
  private noises: Map<string, SimplexNoise> = new Map();

  constructor(private seed: number) {
    // Pre-initialize different noise functions with derived seeds
    this.noises.set("elevation", new SimplexNoise(seed));
    this.noises.set("moisture", new SimplexNoise(seed + 1));
    this.noises.set("temperature", new SimplexNoise(seed + 2));
    this.noises.set("resource", new SimplexNoise(seed + 3));
    this.noises.set("biome_variation", new SimplexNoise(seed + 4));
  }
}
```

## System Architecture

### Domain Layer (`src/domain/game/generation/`)

```
generation/
├── PlanetGenerator.ts          # Master generation coordinator
├── ChunkGenerator.ts           # Individual chunk generation
├── GenerationPipeline.ts       # Stage sequencing and dependencies
├── NoiseGenerator.ts           # Noise function management
├── BiomeGenerator.ts           # Biome assignment and blending
├── stages/                     # Generation stage implementations
│   ├── TerrainGeneration.ts
│   ├── ClimateGeneration.ts
│   ├── FloraGeneration.ts
│   ├── FaunaGeneration.ts
│   ├── ResourceGeneration.ts
│   └── StructureGeneration.ts
├── configs/                    # Planet type configurations
│   ├── EarthLikePlanet.ts
│   ├── DesertPlanet.ts
│   ├── IcePlanet.ts
│   ├── VolcanicPlanet.ts
│   └── ArchipelagoPlanet.ts
└── services/
    ├── GenerationService.ts    # Generation request management
    ├── ChunkManager.ts         # Chunk lifecycle management
    └── GenerationCache.ts      # Generated data caching
```

### Streaming Layer (`src/domain/game/streaming/`)

```
streaming/
├── WorldStreamer.ts           # Manages loading/unloading chunks
├── GenerationScheduler.ts     # Prioritizes generation tasks
├── ChunkLoader.ts             # Loads/saves chunk data
├── LODManager.ts              # Level-of-detail for distant areas
└── MemoryManager.ts           # Prevents memory leaks
```

## Implementation Details

### Multi-Stage Generation

```typescript
class PlanetGenerator {
  async generateChunk(chunkId: ChunkId): Promise<GenerationChunk> {
    const chunk = this.initializeChunk(chunkId);

    // Stage 1: Terrain heightmap
    await this.generateTerrain(chunk);
    chunk.generationLevel = GenerationLevel.TERRAIN;

    // Stage 2: Climate simulation
    await this.generateClimate(chunk);
    chunk.generationLevel = GenerationLevel.CLIMATE;

    // Stage 3: Biome assignment
    await this.generateBiomes(chunk);
    chunk.generationLevel = GenerationLevel.BIOMES;

    // Stage 4: Flora distribution
    await this.generateFlora(chunk);
    chunk.generationLevel = GenerationLevel.FLORA;

    // Stage 5: Fauna spawning
    await this.generateFauna(chunk);
    chunk.generationLevel = GenerationLevel.FAUNA;

    // Stage 6: Resource placement
    await this.generateResources(chunk);
    chunk.generationLevel = GenerationLevel.RESOURCES;

    chunk.generationLevel = GenerationLevel.COMPLETE;
    return chunk;
  }

  private async generateTerrain(chunk: GenerationChunk): Promise<void> {
    const terrainGen = new TerrainGeneration(this.config.terrainConfig, this.noiseGenerator);

    // Generate base elevation using multi-octave noise
    const elevationMap = terrainGen.generateElevationMap(chunk.worldX, chunk.worldY, chunk.size);

    // Apply terrain features (mountains, valleys, plains)
    const features = terrainGen.generateFeatures(elevationMap, chunk.worldX, chunk.worldY);

    // Create terrain cells
    chunk.data.terrain = terrainGen.createTerrainCells(elevationMap, features);
  }
}
```

### Climate Simulation

```typescript
class ClimateGeneration {
  generateClimate(chunk: GenerationChunk): ClimateData {
    const worldPos = { x: chunk.worldX, y: chunk.worldY };

    // Base temperature from latitude (distance from equator)
    const latitude = this.calculateLatitude(worldPos);
    const baseTemp = this.calculateBaseTemperature(latitude);

    // Temperature variation from elevation
    const elevationTemp = this.calculateElevationTemperature(chunk.data.terrain.elevationMap);

    // Ocean influence on temperature and moisture
    const oceanInfluence = this.calculateOceanInfluence(worldPos, chunk.data.terrain);

    // Seasonal variation
    const seasonalVariation = this.calculateSeasonalVariation(latitude);

    // Generate moisture patterns
    const moisture = this.generateMoistureMap(worldPos, oceanInfluence, elevationTemp);

    // Generate precipitation patterns
    const precipitation = this.generatePrecipitationMap(baseTemp, elevationTemp, moisture);

    return {
      temperature: this.combineTemperatureFactors(baseTemp, elevationTemp, oceanInfluence),
      moisture,
      precipitation,
      seasonalVariation,
      windPatterns: this.generateWindPatterns(worldPos, chunk.data.terrain),
    };
  }

  private generateMoistureMap(
    worldPos: Point,
    oceanInfluence: number[][],
    elevation: number[][],
  ): number[][] {
    const moisture: number[][] = [];

    for (let y = 0; y < elevation.length; y++) {
      moisture[y] = [];
      for (let x = 0; x < elevation[y].length; x++) {
        // Base moisture from ocean proximity
        let baseMoisture = oceanInfluence[y][x];

        // Elevation reduces moisture (rain shadow effect)
        const elevationPenalty = Math.max(0, elevation[y][x] - 0.5) * 0.4;
        baseMoisture = Math.max(0, baseMoisture - elevationPenalty);

        // Add noise for natural variation
        const noiseValue = this.noiseGenerator.get(
          "moisture",
          worldPos.x + x,
          worldPos.y + y,
          0.01,
        );
        baseMoisture += noiseValue * 0.2;

        moisture[y][x] = Math.max(0, Math.min(1, baseMoisture));
      }
    }

    return moisture;
  }
}
```

### Flora Distribution

```typescript
class FloraGeneration {
  generateFlora(chunk: GenerationChunk): FloraInstance[] {
    const flora: FloraInstance[] = [];
    const terrain = chunk.data.terrain;
    const climate = chunk.data.climate;
    const biomes = chunk.data.biomes;

    for (let y = 0; y < terrain.size; y++) {
      for (let x = 0; x < terrain.size; x++) {
        const cell = terrain.cells[y][x];
        const biome = biomes.biomeMap[y][x];

        // Get species suitable for this biome
        const suitableSpecies = this.getSuitableFloraSpecies(biome, cell);

        for (const species of suitableSpecies) {
          const density = this.calculateFloraDensity(species, cell, climate);

          // Use noise to create natural clustering
          const clusterNoise = this.noiseGenerator.get(
            "flora_cluster",
            chunk.worldX * terrain.size + x,
            chunk.worldY * terrain.size + y,
            species.clusterFrequency,
          );

          const finalDensity = density * (0.5 + clusterNoise * 0.5);

          if (Math.random() < finalDensity) {
            const worldPos = {
              x: chunk.worldX * terrain.size + x,
              y: chunk.worldY * terrain.size + y,
            };

            const plant = new FloraInstance(species, worldPos);

            // Randomize age for natural variation
            plant.age = Math.random() * species.growth.maxAge * 0.8;
            plant.growthStage = this.calculateGrowthStage(plant.age, species);

            flora.push(plant);
          }
        }
      }
    }

    return flora;
  }

  private calculateFloraDensity(
    species: FloraSpecies,
    cell: TerrainCell,
    climate: ClimateData,
  ): number {
    let density = species.baseDensity;

    // Habitat suitability factors
    const temperatureSuitability = this.calculateSuitability(
      climate.temperature,
      species.habitat.minTemperature,
      species.habitat.maxTemperature,
    );

    const moistureSuitability = this.calculateSuitability(
      cell.moisture,
      species.habitat.minMoisture,
      species.habitat.maxMoisture,
    );

    const elevationSuitability = this.calculateSuitability(
      cell.elevation,
      species.habitat.minElevation,
      species.habitat.maxElevation,
    );

    // Terrain type bonus/penalty
    const terrainBonus = species.habitat.terrainTypes.includes(cell.type) ? 1.0 : 0.1;

    return (
      density * temperatureSuitability * moistureSuitability * elevationSuitability * terrainBonus
    );
  }
}
```

### Fauna Population Spawning

```typescript
class FaunaGeneration {
  generateFauna(chunk: GenerationChunk): CreatureInstance[] {
    const creatures: CreatureInstance[] = [];
    const flora = chunk.data.flora || [];
    const terrain = chunk.data.terrain;
    const biomes = chunk.data.biomes;

    // Calculate carrying capacity for each species
    const carryingCapacities = this.calculateCarryingCapacities(chunk);

    for (const [speciesId, capacity] of carryingCapacities) {
      const species = this.getSpecies(speciesId);

      if (capacity < 1) continue; // Not enough resources to support this species

      // Determine social group sizes
      const groups = this.determineGroupSizes(species, capacity);

      for (const groupSize of groups) {
        // Find suitable spawn location
        const spawnLocation = this.findSpawnLocation(chunk, species);

        if (spawnLocation) {
          const group = this.createSocialGroup(species, groupSize, spawnLocation);
          creatures.push(...group.members);
        }
      }
    }

    return creatures;
  }

  private calculateCarryingCapacities(chunk: GenerationChunk): Map<SpeciesId, number> {
    const capacities = new Map<SpeciesId, number>();
    const flora = chunk.data.flora || [];
    const terrain = chunk.data.terrain;

    // Calculate food availability for herbivores
    for (const herbivorousSpecies of this.getHerbivorousSpecies()) {
      const suitableFlora = flora.filter((plant) =>
        herbivorousSpecies.diet.includes(plant.species.id),
      );

      const foodBiomass = suitableFlora.reduce(
        (sum, plant) => sum + this.calculatePlantBiomass(plant),
        0,
      );

      const capacity = Math.floor(foodBiomass / herbivorousSpecies.foodRequirement);
      capacities.set(herbivorousSpecies.id, capacity);
    }

    // Calculate prey availability for carnivores
    for (const carnivorousSpecies of this.getCarnivorousSpecies()) {
      const preySpecies = carnivorousSpecies.preferredPrey;
      let totalPreyBiomass = 0;

      for (const preySpeciesId of preySpecies) {
        const preyCapacity = capacities.get(preySpeciesId) || 0;
        const preyWeight = this.getSpecies(preySpeciesId).averageWeight;
        totalPreyBiomass += preyCapacity * preyWeight;
      }

      const capacity = Math.floor((totalPreyBiomass * 0.1) / carnivorousSpecies.foodRequirement);
      capacities.set(carnivorousSpecies.id, capacity);
    }

    return capacities;
  }
}
```

### Resource Deposit Placement

```typescript
class ResourceGeneration {
  generateResources(chunk: GenerationChunk): ResourceDeposit[] {
    const deposits: ResourceDeposit[] = [];
    const terrain = chunk.data.terrain;

    for (const resourceType of this.getAllResourceTypes()) {
      const placementRules = this.getPlacementRules(resourceType);

      // Use noise to determine resource-rich areas
      const resourceDensityMap = this.generateResourceDensityMap(chunk, resourceType);

      for (let y = 0; y < terrain.size; y++) {
        for (let x = 0; x < terrain.size; x++) {
          const cell = terrain.cells[y][x];
          const density = resourceDensityMap[y][x];

          if (this.meetsPlacementRules(cell, placementRules) && Math.random() < density) {
            const deposit = this.createResourceDeposit(
              resourceType,
              { x: chunk.worldX * terrain.size + x, y: chunk.worldY * terrain.size + y },
              cell,
            );

            deposits.push(deposit);
          }
        }
      }
    }

    return deposits;
  }

  private generateResourceDensityMap(
    chunk: GenerationChunk,
    resourceType: ResourceType,
  ): number[][] {
    const densityMap: number[][] = [];
    const size = chunk.data.terrain.size;

    for (let y = 0; y < size; y++) {
      densityMap[y] = [];
      for (let x = 0; x < size; x++) {
        // Combine multiple noise octaves for realistic distribution
        let density = 0;

        // Large scale deposits (rare, valuable resources)
        const largeDensity = this.noiseGenerator.get(
          "resource_large",
          chunk.worldX * size + x,
          chunk.worldY * size + y,
          0.003, // very low frequency for rare deposits
        );
        density += largeDensity * 0.1;

        // Medium scale deposits (common resources)
        const mediumDensity = this.noiseGenerator.get(
          "resource_medium",
          chunk.worldX * size + x,
          chunk.worldY * size + y,
          0.02,
        );
        density += mediumDensity * 0.3;

        // Small scale variation
        const smallDensity = this.noiseGenerator.get(
          "resource_small",
          chunk.worldX * size + x,
          chunk.worldY * size + y,
          0.1,
        );
        density += smallDensity * 0.6;

        // Apply resource-specific multipliers
        density *= this.getResourceRarity(resourceType);

        densityMap[y][x] = Math.max(0, Math.min(1, density * 0.5 + 0.5));
      }
    }

    return densityMap;
  }
}
```

## Streaming and Performance

### World Streaming

```typescript
class WorldStreamer {
  private loadedChunks: Map<ChunkId, GenerationChunk> = new Map();
  private generationQueue: ChunkId[] = [];
  private maxLoadedChunks = 25; // 5x5 grid around player

  updatePlayerPosition(playerPos: Point): void {
    const playerChunk = this.worldToChunk(playerPos);
    const requiredChunks = this.getRequiredChunks(playerChunk);

    // Queue chunks for generation
    for (const chunkId of requiredChunks) {
      if (!this.loadedChunks.has(chunkId) && !this.generationQueue.includes(chunkId)) {
        this.generationQueue.push(chunkId);
      }
    }

    // Unload distant chunks
    this.unloadDistantChunks(playerChunk);

    // Process generation queue
    this.processGenerationQueue();
  }

  private async processGenerationQueue(): Promise<void> {
    if (this.generationQueue.length === 0) return;

    const chunkId = this.generationQueue.shift()!;

    try {
      const chunk = await this.planetGenerator.generateChunk(chunkId);
      this.loadedChunks.set(chunkId, chunk);

      // Notify systems that chunk is ready
      this.eventSystem.emit("chunk_loaded", { chunkId, chunk });
    } catch (error) {
      console.error(`Failed to generate chunk ${chunkId}:`, error);
      // Re-queue for retry
      this.generationQueue.push(chunkId);
    }
  }
}
```

### Memory Management

```typescript
class GenerationCache {
  private cache: Map<string, any> = new Map();
  private maxCacheSize = 100 * 1024 * 1024; // 100MB cache
  private currentCacheSize = 0;

  set(key: string, data: any): void {
    const size = this.calculateDataSize(data);

    // Evict old entries if cache would exceed limit
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.evictOldestEntry();
    }

    this.cache.set(key, { data, size, timestamp: Date.now() });
    this.currentCacheSize += size;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (entry) {
      // Update timestamp for LRU eviction
      entry.timestamp = Date.now();
      return entry.data;
    }
    return null;
  }
}
```

## Planet Type Examples

### Earth-like Planet Configuration

```typescript
const EARTH_LIKE_PLANET: PlanetConfiguration = {
  size: PlanetSize.LARGE,
  climateConfig: {
    temperatureRange: { min: -0.3, max: 1.0 },
    moistureRange: { min: 0.0, max: 1.0 },
    seasonalVariation: 0.4,
    poleToEquatorGradient: 0.8,
  },
  terrainConfig: {
    waterCoverage: 0.7,
    elevationVariation: 0.6,
    mountainProbability: 0.3,
    valleyProbability: 0.2,
  },
  biomeConfig: {
    biomeVariety: 8,
    transitionSmoothness: 0.7,
    biomes: [
      BiomeType.TEMPERATE_FOREST,
      BiomeType.TROPICAL_RAINFOREST,
      BiomeType.GRASSLAND,
      BiomeType.DESERT,
      BiomeType.TUNDRA,
      BiomeType.MOUNTAIN,
      BiomeType.OCEAN,
      BiomeType.LAKE,
    ],
  },
  floraConfig: {
    overallDensity: 0.6,
    speciesVariety: 25,
    clusteringFactor: 0.4,
  },
  faunaConfig: {
    overallDensity: 0.3,
    speciesVariety: 15,
    socialGroupProbability: 0.7,
  },
};
```

### Desert Planet Configuration

```typescript
const DESERT_PLANET: PlanetConfiguration = {
  size: PlanetSize.MEDIUM,
  climateConfig: {
    temperatureRange: { min: 0.3, max: 1.0 },
    moistureRange: { min: 0.0, max: 0.3 },
    seasonalVariation: 0.6, // extreme temperature swings
    poleToEquatorGradient: 0.3, // hot everywhere
  },
  terrainConfig: {
    waterCoverage: 0.05, // very little water
    elevationVariation: 0.4,
    mountainProbability: 0.6, // rocky outcrops
    valleyProbability: 0.1,
  },
  biomeConfig: {
    biomeVariety: 3,
    transitionSmoothness: 0.8,
    biomes: [BiomeType.HOT_DESERT, BiomeType.ROCKY_DESERT, BiomeType.OASIS],
  },
  floraConfig: {
    overallDensity: 0.1,
    speciesVariety: 8, // specialized desert plants
    clusteringFactor: 0.8, // clustered around water
  },
  faunaConfig: {
    overallDensity: 0.15,
    speciesVariety: 6, // hardy desert creatures
    socialGroupProbability: 0.4,
  },
};
```

## Integration Points

### With Game Systems

```typescript
interface GenerationCallbacks {
  onChunkGenerated: (chunk: GenerationChunk) => void;
  onFloraSpawned: (flora: FloraInstance[]) => void;
  onFaunaSpawned: (fauna: CreatureInstance[]) => void;
  onResourcesDiscovered: (resources: ResourceDeposit[]) => void;
}

class GenerationIntegration {
  registerWithGameSystems(callbacks: GenerationCallbacks): void {
    this.planetGenerator.onChunkGenerated = callbacks.onChunkGenerated;
    this.floraGenerator.onFloraSpawned = callbacks.onFloraSpawned;
    this.faunaGenerator.onFaunaSpawned = callbacks.onFaunaSpawned;
    this.resourceGenerator.onResourcesDiscovered = callbacks.onResourcesDiscovered;
  }
}
```

## Testing Strategy

### Determinism Tests

```typescript
describe("Procedural Generation", () => {
  it("generates identical results with same seed", () => {
    const seed = 12345;
    const generator1 = new PlanetGenerator(seed, EARTH_LIKE_PLANET);
    const generator2 = new PlanetGenerator(seed, EARTH_LIKE_PLANET);

    const chunk1 = generator1.generateChunk({ x: 0, y: 0 });
    const chunk2 = generator2.generateChunk({ x: 0, y: 0 });

    expect(chunk1).toEqual(chunk2);
  });
});
```

### Performance Benchmarks

```typescript
describe("Generation Performance", () => {
  it("generates chunks within acceptable time limits", async () => {
    const generator = new PlanetGenerator(123, EARTH_LIKE_PLANET);

    const startTime = performance.now();
    const chunk = await generator.generateChunk({ x: 0, y: 0 });
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(100); // 100ms max
    expect(chunk.generationLevel).toBe(GenerationLevel.COMPLETE);
  });
});
```

## Success Metrics

- **Performance**: Generate chunks in <100ms, maintain 60fps during generation
- **Memory Efficiency**: Keep memory usage <500MB with 25 loaded chunks
- **Determinism**: 100% reproducible results with same seed across platforms
- **Ecological Realism**: Generated ecosystems feel natural and balanced
- **Player Experience**: Infinite exploration feels seamless with no loading breaks
