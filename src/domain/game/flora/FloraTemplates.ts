import {
  type FloraSpecies,
  FloraCategory,
  LightLevel,
  SoilType,
  ReproductionMethod,
  RegenerationMode,
  AnimationType,
} from "./FloraSpecies";

export class FloraTemplates {
  private templates: Map<string, FloraSpecies> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  getSpecies(id: string): FloraSpecies | undefined {
    return this.templates.get(id);
  }

  getAllSpecies(): FloraSpecies[] {
    return Array.from(this.templates.values());
  }

  getSpeciesByCategory(category: FloraCategory): FloraSpecies[] {
    return Array.from(this.templates.values()).filter(species => species.category === category);
  }

  getSpeciesForBiome(biome: string): FloraSpecies[] {
    return Array.from(this.templates.values()).filter(species => 
      species.habitat.biomes.includes(biome)
    );
  }

  private initializeTemplates(): void {
    // Common Oak Tree
    this.templates.set("oak_tree", {
      id: "oak_tree",
      name: "Common Oak",
      category: FloraCategory.TREE,
      habitat: {
        biomes: ["temperate_forest", "grassland", "woodland"],
        minTemperature: 0.2,
        maxTemperature: 0.8,
        minMoisture: 0.3,
        maxMoisture: 0.9,
        minElevation: 0.0,
        maxElevation: 0.7,
        lightRequirement: LightLevel.PARTIAL_SUN,
        soilTypes: [SoilType.LOAM, SoilType.CLAY],
        companionSpecies: ["wildflower_patch", "fern"],
      },
      growth: {
        stages: [
          {
            id: "seedling",
            name: "Seedling", 
            duration: 24,
            requirements: { minAge: 0, environmentalFactors: new Map() },
            appearance: { size: 0.1, color: "#90EE90", sprite: "oak_seedling" },
            harvestYield: 0.1,
            reproduction: false,
          },
          {
            id: "sapling",
            name: "Sapling",
            duration: 120, 
            requirements: { minAge: 24, environmentalFactors: new Map() },
            appearance: { size: 0.3, color: "#228B22", sprite: "oak_sapling" },
            harvestYield: 0.3,
            reproduction: false,
          },
          {
            id: "young",
            name: "Young Tree",
            duration: 240,
            requirements: { minAge: 144, environmentalFactors: new Map() },
            appearance: { size: 0.6, color: "#228B22", sprite: "oak_young" },
            harvestYield: 0.6,
            reproduction: false,
          },
          {
            id: "mature", 
            name: "Mature Tree",
            duration: 480,
            requirements: { minAge: 384, environmentalFactors: new Map() },
            appearance: { size: 1.0, color: "#006400", sprite: "oak_mature" },
            harvestYield: 1.0,
            reproduction: true,
          },
          {
            id: "elder",
            name: "Elder Tree", 
            duration: -1,
            requirements: { minAge: 864, environmentalFactors: new Map() },
            appearance: { size: 1.2, color: "#006400", sprite: "oak_elder" },
            harvestYield: 1.2,
            reproduction: true,
          },
        ],
        maxAge: 2000,
        baseGrowthRate: 0.5,
        seasonalGrowth: true,
        energyRequirement: 0.6,
        spreadRate: 0.1,
        maxSize: 15,
      },
      appearance: {
        baseColor: "#006400",
        seasonalColors: new Map([
          ["spring", "#32CD32"],
          ["summer", "#006400"], 
          ["autumn", "#FF6347"],
          ["winter", "#8B4513"],
        ]),
        textures: ["oak_bark", "oak_leaves"],
        animations: [
          {
            type: AnimationType.SWAY,
            duration: 3000,
            conditions: [{ type: "wind", value: 0.3 }],
          },
        ],
        particleEffects: ["falling_leaves"],
      },
      harvestable: {
        resources: [
          {
            itemType: "wood",
            baseQuantity: 5,
            probability: 1.0,
            qualityRange: [0.6, 1.0],
            condition: { growthStage: "mature" },
          },
          {
            itemType: "acorns",
            baseQuantity: 10,
            probability: 0.8,
            qualityRange: [0.4, 1.0],
            condition: { growthStage: "mature", season: "autumn" },
          },
          {
            itemType: "oak_bark",
            baseQuantity: 2,
            probability: 0.6,
            qualityRange: [0.5, 0.9],
          },
        ],
        tools: ["axe"],
        skillRequirement: "forestry",
        baseYield: 1.0,
        qualityFactors: [
          { factor: "age", weight: 0.3 },
          { factor: "tool", weight: 0.4 },
          { factor: "environment", weight: 0.3 },
        ],
        seasonalModifiers: new Map([
          ["spring", 1.2],
          ["summer", 1.0],
          ["autumn", 1.1],
          ["winter", 0.8],
        ]),
        regeneration: RegenerationMode.NONE,
      },
      reproduction: {
        method: ReproductionMethod.SEEDS,
        frequency: 1,
        requirements: [
          { type: "health", value: 0.7 },
          { type: "nutrients", value: 0.4 },
        ],
        offspring: {
          count: [5, 20],
          dispersalDistance: 50,
          survivalRate: 0.1,
          mutationChance: 0.05,
        },
      },
      resilience: {
        diseaseResistance: 0.7,
        pestResistance: 0.6,
        droughtTolerance: 0.5,
        frostTolerance: 0.8,
        fireResistance: 0.3,
        recoveryRate: 0.2,
      },
    });

    // Berry Bush
    this.templates.set("berry_bush", {
      id: "berry_bush",
      name: "Wild Berry Bush",
      category: FloraCategory.SHRUB,
      habitat: {
        biomes: ["temperate_forest", "woodland", "meadow"],
        minTemperature: 0.3,
        maxTemperature: 0.7,
        minMoisture: 0.4,
        maxMoisture: 0.8,
        minElevation: 0.0,
        maxElevation: 0.6,
        lightRequirement: LightLevel.DAPPLED_LIGHT,
        soilTypes: [SoilType.ORGANIC, SoilType.LOAM],
      },
      growth: {
        stages: [
          {
            id: "sprout",
            name: "Sprout",
            duration: 12,
            requirements: { minAge: 0, environmentalFactors: new Map() },
            appearance: { size: 0.15, color: "#90EE90", sprite: "berry_sprout" },
            harvestYield: 0,
            reproduction: false,
          },
          {
            id: "growing",
            name: "Growing Bush",
            duration: 48,
            requirements: { minAge: 12, environmentalFactors: new Map() },
            appearance: { size: 0.5, color: "#228B22", sprite: "berry_growing" },
            harvestYield: 0.2,
            reproduction: false,
          },
          {
            id: "flowering",
            name: "Flowering Bush",
            duration: 24,
            requirements: { minAge: 60, environmentalFactors: new Map() },
            appearance: { size: 0.8, color: "#FFB6C1", sprite: "berry_flowering" },
            harvestYield: 0.1,
            reproduction: true,
          },
          {
            id: "fruiting",
            name: "Berry Bearing",
            duration: 72,
            requirements: { minAge: 84, environmentalFactors: new Map() },
            appearance: { size: 1.0, color: "#DC143C", sprite: "berry_fruiting" },
            harvestYield: 1.0,
            reproduction: true,
          },
        ],
        maxAge: 500,
        baseGrowthRate: 1.0,
        seasonalGrowth: true,
        energyRequirement: 0.4,
        spreadRate: 0.3,
        maxSize: 3,
      },
      appearance: {
        baseColor: "#228B22",
        seasonalColors: new Map([
          ["spring", "#90EE90"],
          ["summer", "#DC143C"],
          ["autumn", "#8B0000"], 
          ["winter", "#696969"],
        ]),
        textures: ["berry_leaves", "berries"],
        animations: [
          {
            type: AnimationType.RUSTLE,
            duration: 1000,
            conditions: [{ type: "interaction", value: 1.0 }],
          },
        ],
        particleEffects: ["berry_sparkle"],
      },
      harvestable: {
        resources: [
          {
            itemType: "wild_berries",
            baseQuantity: 8,
            probability: 1.0,
            qualityRange: [0.7, 1.0],
            condition: { growthStage: "fruiting", season: "summer" },
          },
          {
            itemType: "berry_leaves",
            baseQuantity: 3,
            probability: 0.7,
            qualityRange: [0.5, 0.8],
          },
          {
            itemType: "berry_seeds",
            baseQuantity: 2,
            probability: 0.4,
            qualityRange: [0.6, 0.9],
            condition: { growthStage: "fruiting" },
          },
        ],
        tools: [],
        baseYield: 1.0,
        qualityFactors: [
          { factor: "season", weight: 0.5 },
          { factor: "environment", weight: 0.3 },
          { factor: "age", weight: 0.2 },
        ],
        seasonalModifiers: new Map([
          ["spring", 0.3],
          ["summer", 1.0],
          ["autumn", 0.8],
          ["winter", 0.1],
        ]),
        regeneration: RegenerationMode.SEASONAL,
      },
      reproduction: {
        method: ReproductionMethod.SEEDS,
        frequency: 2,
        requirements: [
          { type: "health", value: 0.6 },
        ],
        offspring: {
          count: [2, 8],
          dispersalDistance: 20,
          survivalRate: 0.3,
          mutationChance: 0.1,
        },
        pollinators: ["bee", "butterfly"],
      },
      resilience: {
        diseaseResistance: 0.5,
        pestResistance: 0.4,
        droughtTolerance: 0.6,
        frostTolerance: 0.7,
        fireResistance: 0.4,
        recoveryRate: 0.8,
      },
    });

    // Medicinal Herb
    this.templates.set("healing_herb", {
      id: "healing_herb",
      name: "Healing Herb",
      category: FloraCategory.FLOWER,
      habitat: {
        biomes: ["meadow", "woodland", "grassland"],
        minTemperature: 0.4,
        maxTemperature: 0.8,
        minMoisture: 0.3,
        maxMoisture: 0.7,
        minElevation: 0.0,
        maxElevation: 0.8,
        lightRequirement: LightLevel.PARTIAL_SUN,
        soilTypes: [SoilType.LOAM, SoilType.ORGANIC],
        companionSpecies: ["wildflower_patch"],
        avoidSpecies: ["oak_tree"],
      },
      growth: {
        stages: [
          {
            id: "seed",
            name: "Germinating Seed",
            duration: 2,
            requirements: { minAge: 0, environmentalFactors: new Map() },
            appearance: { size: 0.05, color: "#32CD32", sprite: "herb_seed" },
            harvestYield: 0,
            reproduction: false,
          },
          {
            id: "sprout",
            name: "Young Sprout",
            duration: 8,
            requirements: { minAge: 2, environmentalFactors: new Map() },
            appearance: { size: 0.2, color: "#90EE90", sprite: "herb_sprout" },
            harvestYield: 0.1,
            reproduction: false,
          },
          {
            id: "mature",
            name: "Flowering Plant",
            duration: 16,
            requirements: { minAge: 10, environmentalFactors: new Map() },
            appearance: { size: 0.6, color: "#9370DB", sprite: "herb_flowering" },
            harvestYield: 1.0,
            reproduction: true,
          },
          {
            id: "seeding",
            name: "Going to Seed", 
            duration: 8,
            requirements: { minAge: 26, environmentalFactors: new Map() },
            appearance: { size: 0.8, color: "#8B4513", sprite: "herb_seeding" },
            harvestYield: 0.3,
            reproduction: true,
          },
        ],
        maxAge: 40,
        baseGrowthRate: 2.0,
        seasonalGrowth: true,
        energyRequirement: 0.3,
        spreadRate: 0.8,
        maxSize: 1,
      },
      appearance: {
        baseColor: "#9370DB",
        seasonalColors: new Map([
          ["spring", "#90EE90"],
          ["summer", "#9370DB"],
          ["autumn", "#8B4513"],
          ["winter", "#696969"],
        ]),
        textures: ["herb_leaves", "herb_flowers"],
        animations: [
          {
            type: AnimationType.SWAY,
            duration: 2000,
            conditions: [{ type: "wind", value: 0.1 }],
          },
          {
            type: AnimationType.BLOOM,
            duration: 5000,
            conditions: [{ type: "stage", value: 2 }],
          },
        ],
        particleEffects: ["pollen", "sparkle"],
      },
      harvestable: {
        resources: [
          {
            itemType: "healing_herbs",
            baseQuantity: 3,
            probability: 1.0,
            qualityRange: [0.8, 1.0],
            condition: { growthStage: "mature" },
          },
          {
            itemType: "herb_essence",
            baseQuantity: 1,
            probability: 0.3,
            qualityRange: [0.9, 1.0],
            condition: { growthStage: "mature", tool: "essence_extractor" },
          },
          {
            itemType: "herb_seeds",
            baseQuantity: 5,
            probability: 0.8,
            qualityRange: [0.6, 0.9],
            condition: { growthStage: "seeding" },
          },
        ],
        tools: ["knife", "herb_shears"],
        skillRequirement: "herbalism",
        baseYield: 1.0,
        qualityFactors: [
          { factor: "tool", weight: 0.4 },
          { factor: "timing", weight: 0.3 },
          { factor: "environment", weight: 0.3 },
        ],
        seasonalModifiers: new Map([
          ["spring", 1.2],
          ["summer", 1.0],
          ["autumn", 0.9],
          ["winter", 0.3],
        ]),
        regeneration: RegenerationMode.FULL,
      },
      reproduction: {
        method: ReproductionMethod.SEEDS,
        frequency: 3,
        requirements: [
          { type: "health", value: 0.5 },
        ],
        offspring: {
          count: [3, 12],
          dispersalDistance: 15,
          survivalRate: 0.6,
          mutationChance: 0.15,
        },
        pollinators: ["bee", "butterfly", "hummingbird"],
      },
      resilience: {
        diseaseResistance: 0.6,
        pestResistance: 0.5,
        droughtTolerance: 0.4,
        frostTolerance: 0.3,
        fireResistance: 0.2,
        recoveryRate: 1.2,
      },
    });

    // Grass
    this.templates.set("common_grass", {
      id: "common_grass", 
      name: "Common Grass",
      category: FloraCategory.GRASS,
      habitat: {
        biomes: ["grassland", "meadow", "woodland", "temperate_forest"],
        minTemperature: 0.2,
        maxTemperature: 0.9,
        minMoisture: 0.2,
        maxMoisture: 0.8,
        minElevation: 0.0,
        maxElevation: 0.9,
        lightRequirement: LightLevel.PARTIAL_SUN,
        soilTypes: [SoilType.LOAM, SoilType.SAND, SoilType.CLAY],
      },
      growth: {
        stages: [
          {
            id: "seedling",
            name: "Grass Seedling",
            duration: 1,
            requirements: { minAge: 0, environmentalFactors: new Map() },
            appearance: { size: 0.1, color: "#90EE90", sprite: "grass_seedling" },
            harvestYield: 0,
            reproduction: false,
          },
          {
            id: "mature",
            name: "Mature Grass",
            duration: -1,
            requirements: { minAge: 1, environmentalFactors: new Map() },
            appearance: { size: 1.0, color: "#228B22", sprite: "grass_mature" },
            harvestYield: 1.0,
            reproduction: true,
          },
        ],
        maxAge: 100,
        baseGrowthRate: 5.0,
        seasonalGrowth: true,
        energyRequirement: 0.2,
        spreadRate: 2.0,
        maxSize: 0.5,
      },
      appearance: {
        baseColor: "#228B22",
        seasonalColors: new Map([
          ["spring", "#90EE90"],
          ["summer", "#228B22"],
          ["autumn", "#DAA520"],
          ["winter", "#8B7355"],
        ]),
        textures: ["grass_blades"],
        animations: [
          {
            type: AnimationType.SWAY,
            duration: 1500,
            conditions: [{ type: "wind", value: 0.05 }],
          },
        ],
        particleEffects: [],
      },
      harvestable: {
        resources: [
          {
            itemType: "plant_fiber",
            baseQuantity: 2,
            probability: 1.0,
            qualityRange: [0.3, 0.7],
          },
          {
            itemType: "grass_seeds",
            baseQuantity: 4,
            probability: 0.6,
            qualityRange: [0.4, 0.8],
            condition: { season: "late_summer" },
          },
        ],
        tools: ["scythe", "knife"],
        baseYield: 1.0,
        qualityFactors: [
          { factor: "tool", weight: 0.6 },
          { factor: "season", weight: 0.4 },
        ],
        seasonalModifiers: new Map([
          ["spring", 1.0],
          ["summer", 1.2],
          ["autumn", 0.8],
          ["winter", 0.4],
        ]),
        regeneration: RegenerationMode.FULL,
      },
      reproduction: {
        method: ReproductionMethod.RUNNERS,
        frequency: 6,
        requirements: [],
        offspring: {
          count: [1, 4],
          dispersalDistance: 5,
          survivalRate: 0.9,
          mutationChance: 0.02,
        },
      },
      resilience: {
        diseaseResistance: 0.8,
        pestResistance: 0.7,
        droughtTolerance: 0.7,
        frostTolerance: 0.9,
        fireResistance: 0.1,
        recoveryRate: 2.0,
      },
    });
  }
}