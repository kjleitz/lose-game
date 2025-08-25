# Planet Terrain System Design

## Overview

The terrain system generates diverse planet surfaces with multiple terrain types, water bodies, elevation changes, and biome variations. It provides the foundation for all planet-based exploration and resource gathering.

## Core Requirements

- **Multiple terrain types**: Grass, desert, rock, snow, volcanic, forest, swamp
- **Water systems**: Oceans, lakes, rivers, sometimes island-only planets
- **Elevation mapping**: Hills, mountains, valleys affecting movement and visibility
- **Biome transitions**: Smooth blending between different terrain types
- **Performance**: Efficient rendering and collision detection for large worlds

## Domain Model

### Terrain Types

```typescript
enum TerrainType {
  GRASS = "grass",
  DESERT = "desert",
  ROCK = "rock",
  SNOW = "snow",
  VOLCANIC = "volcanic",
  FOREST = "forest",
  SWAMP = "swamp",
  WATER = "water",
  DEEP_WATER = "deep_water",
}

interface TerrainCell {
  readonly type: TerrainType;
  readonly elevation: number; // 0-1 normalized
  readonly moisture: number; // 0-1 normalized
  readonly temperature: number; // 0-1 normalized
  readonly fertility: number; // affects flora density
  readonly traversable: boolean;
  readonly color: string;
  readonly movementModifier: number; // speed multiplier
}
```

### Terrain Chunks

```typescript
interface TerrainChunk {
  readonly id: ChunkId;
  readonly x: number;
  readonly y: number;
  readonly size: number; // cells per side
  readonly cells: TerrainCell[][];
  readonly generated: boolean;
  readonly waterBodies: WaterBody[];
  readonly resources: TerrainResource[];
}

interface WaterBody {
  readonly type: "lake" | "river" | "ocean";
  readonly points: Point[];
  readonly depth: number;
  readonly salinity: number; // affects what can live in it
}
```

## System Architecture

### Domain Layer (`src/domain/game/terrain/`)

```
terrain/
├── TerrainGenerator.ts      # Core generation algorithms
├── TerrainChunk.ts         # Chunk data structure
├── TerrainCell.ts          # Individual cell logic
├── BiomeMapper.ts          # Terrain type determination
├── ElevationGenerator.ts   # Height map generation
├── WaterSystem.ts          # Water body placement
├── ClimateSystem.ts        # Temperature/moisture simulation
└── services/
    ├── TerrainService.ts   # Chunk management
    └── TerrainQuery.ts     # Spatial queries
```

### Rendering Layer (`src/domain/render/terrain/`)

```
terrain/
├── TerrainRenderer.ts      # Master terrain renderer
├── TerrainTileRenderer.ts  # Individual tile rendering
├── WaterRenderer.ts        # Water animation/effects
├── ElevationRenderer.ts    # Height-based shading
└── BiomeRenderer.ts        # Biome-specific visuals
```

## Implementation Details

### Terrain Generation Algorithm

```typescript
class TerrainGenerator {
  private noise: SimplexNoise;
  private climate: ClimateSystem;
  private biomeMapper: BiomeMapper;

  generateChunk(chunkX: number, chunkY: number, planetSeed: number): TerrainChunk {
    // 1. Generate base elevation using multi-octave noise
    const elevationMap = this.generateElevation(chunkX, chunkY);

    // 2. Generate moisture and temperature maps
    const climateData = this.climate.generateClimate(chunkX, chunkY, elevationMap);

    // 3. Determine terrain types based on climate
    const cells = this.biomeMapper.mapTerrain(elevationMap, climateData);

    // 4. Place water bodies
    const waterBodies = this.placeWaterBodies(cells, elevationMap);

    // 5. Generate resource deposits
    const resources = this.generateResources(cells, elevationMap);

    return new TerrainChunk({
      x: chunkX,
      y: chunkY,
      cells,
      waterBodies,
      resources,
    });
  }
}
```

### Biome Mapping

```typescript
class BiomeMapper {
  mapTerrain(elevation: number[][], climate: ClimateData): TerrainCell[][] {
    return elevation.map((row, y) =>
      row.map((elev, x) => {
        const moisture = climate.moisture[y][x];
        const temp = climate.temperature[y][x];

        // Water placement based on elevation
        if (elev < 0.3) {
          return this.createWaterCell(elev);
        }

        // Biome determination using Whittaker biome classification
        const biome = this.classifyBiome(temp, moisture, elev);
        return this.createTerrainCell(biome, elev, moisture, temp);
      }),
    );
  }

  private classifyBiome(temp: number, moisture: number, elevation: number): TerrainType {
    // High elevation = rock/snow
    if (elevation > 0.8) return temp < 0.3 ? TerrainType.SNOW : TerrainType.ROCK;

    // Temperature-moisture matrix
    if (temp < 0.2) return TerrainType.SNOW;
    if (temp > 0.8) {
      if (moisture < 0.2) return TerrainType.DESERT;
      if (moisture < 0.4) return TerrainType.VOLCANIC;
      return TerrainType.SWAMP;
    }

    // Temperate zones
    if (moisture < 0.3) return TerrainType.DESERT;
    if (moisture < 0.6) return TerrainType.GRASS;
    return TerrainType.FOREST;
  }
}
```

## Performance Considerations

### Chunk-Based Generation

- **Lazy Loading**: Generate chunks only when player approaches
- **Chunk Size**: 64x64 cells per chunk for optimal performance
- **Unloading**: Remove distant chunks from memory
- **Caching**: Store generated chunks to disk for revisiting

### Rendering Optimization

```typescript
class TerrainRenderer {
  private visibleChunks: Set<ChunkId> = new Set();
  private chunkCache: Map<ChunkId, RenderedChunk> = new Map();

  render(ctx: CanvasRenderingContext2D, camera: Camera, chunks: TerrainChunk[]) {
    // Only render visible chunks
    const visibleChunks = this.getVisibleChunks(camera, chunks);

    for (const chunk of visibleChunks) {
      if (!this.chunkCache.has(chunk.id)) {
        // Pre-render chunk to offscreen canvas
        this.preRenderChunk(chunk);
      }

      // Blit pre-rendered chunk to main canvas
      this.blitChunk(ctx, chunk, camera);
    }
  }
}
```

## Planet Variation

### Planet Types

```typescript
interface PlanetTerrainConfig {
  readonly waterCoverage: number; // 0-1, percentage of planet covered by water
  readonly islandMode: boolean; // true for island-only planets
  readonly biomeVariety: number; // 0-1, how many different biomes
  readonly elevationRange: number; // 0-1, how mountainous
  readonly climateZones: number; // number of distinct climate regions
}

// Example configurations
const EARTH_LIKE: PlanetTerrainConfig = {
  waterCoverage: 0.7,
  islandMode: false,
  biomeVariety: 0.8,
  elevationRange: 0.6,
  climateZones: 3,
};

const ARCHIPELAGO: PlanetTerrainConfig = {
  waterCoverage: 0.9,
  islandMode: true,
  biomeVariety: 0.4,
  elevationRange: 0.3,
  climateZones: 1,
};

const DESERT_WORLD: PlanetTerrainConfig = {
  waterCoverage: 0.1,
  islandMode: false,
  biomeVariety: 0.2,
  elevationRange: 0.4,
  climateZones: 1,
};
```

## Integration Points

### With Player Movement

```typescript
class PlayerMovement {
  getMovementSpeed(terrain: TerrainCell): number {
    return BASE_SPEED * terrain.movementModifier;
  }

  canTraverse(terrain: TerrainCell): boolean {
    return terrain.traversable;
  }
}
```

### With Flora/Fauna Systems

```typescript
interface SpawnConditions {
  readonly terrainTypes: TerrainType[];
  readonly minElevation: number;
  readonly maxElevation: number;
  readonly minMoisture: number;
  readonly preferredTemperature: number;
}
```

### With Resource System

```typescript
interface TerrainResource {
  readonly type: ResourceType;
  readonly quantity: number;
  readonly extractionDifficulty: number;
  readonly requiredTools: ItemType[];
  readonly position: Point;
}
```

## Testing Strategy

### Unit Tests

- **Noise Generation**: Verify terrain height maps are consistent and varied
- **Biome Classification**: Test terrain type assignment for different climate conditions
- **Water Placement**: Ensure water bodies form realistically based on elevation
- **Chunk Boundaries**: Verify seamless transitions between adjacent chunks

### Integration Tests

- **Chunk Loading**: Test chunk generation and unloading based on player position
- **Performance**: Benchmark rendering performance with different chunk sizes
- **Memory Usage**: Monitor memory consumption during extended exploration

### Visual Tests

- **Biome Transitions**: Screenshot tests for smooth terrain type blending
- **Water Rendering**: Verify water bodies render correctly with elevation
- **Large Scale**: Generate large terrain areas and verify visual consistency

## Migration from Current System

### Phase 1: Core Terrain

1. Replace simple planet surface with chunk-based terrain system
2. Implement basic grass/water terrain types
3. Update rendering to use new terrain chunks

### Phase 2: Biome Variety

1. Add additional terrain types (desert, forest, rock, etc.)
2. Implement climate-based biome generation
3. Add biome-specific visual styling

### Phase 3: Water Systems

1. Implement water bodies with proper rendering
2. Add water physics (swimming, boats eventually)
3. Integrate with fauna system (aquatic creatures)

### Phase 4: Optimization

1. Implement chunk caching and prerendering
2. Add level-of-detail for distant terrain
3. Optimize memory usage for large worlds

## Success Metrics

- **Variety**: Players encounter 5+ distinct biomes per planet
- **Performance**: Maintain 60fps while generating terrain chunks
- **Memory**: Keep memory usage under 500MB for extended exploration
- **Visual Quality**: Smooth transitions between biomes and realistic water placement
- **Gameplay**: Terrain affects player movement and resource availability meaningfully
