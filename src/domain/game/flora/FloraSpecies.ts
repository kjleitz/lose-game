import type { DamageableEntity, HealthComponent, DropTable } from "../damage/DamageableEntity";
import type { Item } from "../items/Item";

export interface FloraSpecies {
  readonly id: string;
  readonly name: string;
  readonly category: FloraCategory;
  readonly habitat: HabitatRequirements;
  readonly growth: GrowthProperties;
  readonly appearance: AppearanceProperties;
  readonly harvestable: HarvestableProperties;
  readonly reproduction: ReproductionProperties;
  readonly resilience: ResilienceProperties;
}

export enum FloraCategory {
  TREE = "tree",
  SHRUB = "shrub", 
  GRASS = "grass",
  FLOWER = "flower",
  VINE = "vine",
  MOSS = "moss",
  FUNGUS = "fungus",
  CROP = "crop", // cultivated plants
  AQUATIC = "aquatic",
}

export interface HabitatRequirements {
  readonly biomes: string[]; // which biomes this species can grow in
  readonly minTemperature: number; // 0-1 normalized
  readonly maxTemperature: number;
  readonly minMoisture: number; // 0-1 normalized
  readonly maxMoisture: number;
  readonly minElevation: number; // 0-1 normalized
  readonly maxElevation: number;
  readonly lightRequirement: LightLevel;
  readonly soilTypes: SoilType[];
  readonly companionSpecies?: string[]; // grows better near these species
  readonly avoidSpecies?: string[]; // grows poorly near these species
}

export enum LightLevel {
  FULL_SHADE = "full_shade", // dense forest floor
  PARTIAL_SHADE = "partial_shade", // forest edges
  DAPPLED_LIGHT = "dappled_light", // under canopy
  PARTIAL_SUN = "partial_sun", // open areas with some shade
  FULL_SUN = "full_sun", // completely open areas
}

export enum SoilType {
  CLAY = "clay",
  SAND = "sand",
  LOAM = "loam",
  ROCKY = "rocky",
  ORGANIC = "organic", // rich humus
  ACIDIC = "acidic",
  ALKALINE = "alkaline",
}

export interface GrowthProperties {
  readonly stages: GrowthStage[];
  readonly maxAge: number; // in game hours
  readonly baseGrowthRate: number; // stage progression per hour
  readonly seasonalGrowth: boolean; // affected by seasons
  readonly energyRequirement: number; // environmental energy needed
  readonly spreadRate: number; // how fast it spreads to new locations
  readonly maxSize: number; // final radius when mature
}

export interface GrowthStage {
  readonly id: string;
  readonly name: string;
  readonly duration: number; // hours to complete this stage
  readonly requirements: StageRequirements;
  readonly appearance: StageAppearance;
  readonly harvestYield: number; // multiplier for harvest yield
  readonly reproduction: boolean; // can reproduce at this stage
}

export interface StageRequirements {
  readonly minAge: number;
  readonly environmentalFactors: Map<string, number>;
  readonly nutrients?: number; // soil nutrients needed
  readonly water?: number; // water requirement
}

export interface StageAppearance {
  readonly size: number; // relative size (0-1)
  readonly color: string;
  readonly sprite: string;
  readonly effects?: VisualEffect[];
}

export interface VisualEffect {
  readonly type: string;
  readonly intensity: number;
  readonly duration?: number;
}

export interface AppearanceProperties {
  readonly baseColor: string;
  readonly seasonalColors: Map<string, string>; // season -> color
  readonly textures: string[];
  readonly animations: PlantAnimation[];
  readonly particleEffects: string[];
}

export interface PlantAnimation {
  readonly type: AnimationType;
  readonly duration: number;
  readonly conditions: AnimationCondition[];
}

export enum AnimationType {
  SWAY = "sway", // gentle movement in wind
  RUSTLE = "rustle", // leaves rustling
  BLOOM = "bloom", // flowering animation  
  WITHER = "wither", // dying animation
  GROWTH = "growth", // growing larger
}

export interface AnimationCondition {
  readonly type: string;
  readonly value: number;
}

export interface HarvestableProperties {
  readonly resources: HarvestResource[];
  readonly tools: string[]; // required tools for optimal harvest
  readonly skillRequirement?: string; // required skill
  readonly baseYield: number;
  readonly qualityFactors: QualityFactor[];
  readonly seasonalModifiers: Map<string, number>; // season -> yield multiplier
  readonly regeneration: RegenerationMode;
}

export interface HarvestResource {
  readonly itemType: string;
  readonly baseQuantity: number;
  readonly probability: number; // 0-1 chance to drop
  readonly qualityRange: [number, number]; // min, max quality
  readonly condition?: HarvestCondition;
}

export interface HarvestCondition {
  readonly growthStage?: string; // must be in specific stage
  readonly season?: string; // must be specific season
  readonly tool?: string; // must use specific tool
  readonly timeOfDay?: string; // must harvest at specific time
}

export interface QualityFactor {
  readonly factor: string; // "age", "environment", "tool", etc.
  readonly weight: number; // importance of this factor
}

export enum RegenerationMode {
  NONE = "none", // dies when harvested
  PARTIAL = "partial", // regrows some resources over time
  FULL = "full", // fully regenerates after harvest
  SEASONAL = "seasonal", // regenerates seasonally
  SPREADS = "spreads", // creates new plants when harvested
}

export interface ReproductionProperties {
  readonly method: ReproductionMethod;
  readonly frequency: number; // attempts per season
  readonly requirements: ReproductionRequirement[];
  readonly offspring: OffspringProperties;
  readonly pollinators?: string[]; // required creature types for pollination
}

export enum ReproductionMethod {
  SEEDS = "seeds", // produces seeds
  SPORES = "spores", // fungal spores
  RUNNERS = "runners", // underground runners
  BULBS = "bulbs", // bulb division
  CUTTINGS = "cuttings", // branch propagation
  GRAFTING = "grafting", // requires another plant
}

export interface ReproductionRequirement {
  readonly type: string;
  readonly value: number;
  readonly season?: string;
}

export interface OffspringProperties {
  readonly count: [number, number]; // min, max offspring
  readonly dispersalDistance: number;
  readonly survivalRate: number; // 0-1 probability offspring survive
  readonly mutationChance: number; // 0-1 chance of genetic variation
}

export interface ResilienceProperties {
  readonly diseaseResistance: number; // 0-1, resistance to plant diseases
  readonly pestResistance: number; // 0-1, resistance to harmful insects
  readonly droughtTolerance: number; // 0-1, survival without water
  readonly frostTolerance: number; // 0-1, survival in cold
  readonly fireResistance: number; // 0-1, survival of fires
  readonly recoveryRate: number; // how fast it recovers from damage
}

// Flora instance - an actual plant in the world
export interface FloraInstance extends DamageableEntity {
  readonly species: FloraSpecies;
  age: number; // current age in game hours
  currentStage: string; // current growth stage ID
  lastGrowthUpdate: number; // timestamp of last growth update
  readonly environmentalFactors: Map<string, number>;
  nutrients: number; // current soil nutrients available
  waterLevel: number; // current water availability
  readonly genetics: GeneticTraits; // individual variations
  diseases: PlantDisease[]; // active diseases
  readonly socialConnections: SocialConnection[]; // connections to other plants
}

export interface GeneticTraits {
  readonly growthRate: number; // genetic modifier for growth speed
  readonly size: number; // genetic modifier for max size
  readonly yieldBonus: number; // genetic modifier for harvest yield
  readonly resilience: number; // genetic modifier for environmental resistance
  readonly color: string; // genetic color variation
}

export interface PlantDisease {
  readonly type: string;
  readonly severity: number; // 0-1
  readonly progression: number; // how fast it spreads
  readonly effects: DiseaseEffect[];
}

export interface DiseaseEffect {
  readonly type: string; // "growth_slow", "yield_reduce", "appearance_change"
  readonly intensity: number;
}

export interface SocialConnection {
  readonly targetId: string; // connected plant ID
  readonly type: ConnectionType;
  readonly strength: number; // connection strength
}

export enum ConnectionType {
  MYCORRHIZAL = "mycorrhizal", // fungal network connection
  ROOT_GRAFTING = "root_grafting", // root systems merged
  CHEMICAL_COMMUNICATION = "chemical_communication", // chemical signals
  POLLINATION = "pollination", // pollination relationship
  COMPETITION = "competition", // competing for resources
}

export class FloraInstanceImpl implements FloraInstance {
  readonly id: string;
  readonly position: { x: number; y: number };
  health: HealthComponent;
  readonly dropTable: DropTable;
  readonly destructionEffect?: any;
  
  readonly species: FloraSpecies;
  age: number = 0;
  currentStage: string;
  lastGrowthUpdate: number;
  readonly environmentalFactors: Map<string, number>;
  nutrients: number = 1.0;
  waterLevel: number = 1.0;
  readonly genetics: GeneticTraits;
  diseases: PlantDisease[] = [];
  readonly socialConnections: SocialConnection[] = [];

  constructor(
    id: string,
    position: { x: number; y: number },
    species: FloraSpecies,
    genetics?: Partial<GeneticTraits>,
  ) {
    this.id = id;
    this.position = position;
    this.species = species;
    this.currentStage = species.growth.stages[0].id;
    this.lastGrowthUpdate = Date.now();
    this.environmentalFactors = new Map();
    
    // Generate genetic traits
    this.genetics = {
      growthRate: 0.8 + Math.random() * 0.4, // 0.8-1.2x multiplier
      size: 0.8 + Math.random() * 0.4,
      yieldBonus: 0.9 + Math.random() * 0.2,
      resilience: 0.9 + Math.random() * 0.2,
      color: this.generateGeneticColor(),
      ...genetics,
    };

    // Initialize health based on species
    this.health = {
      maxHealth: 50 + species.growth.maxSize * 10,
      currentHealth: 50 + species.growth.maxSize * 10,
      resistances: new Map(),
      vulnerabilities: new Map(),
      regeneration: species.resilience.recoveryRate,
      invulnerabilityPeriod: 1000,
      lastDamageTime: 0,
    };

    // Generate drop table from harvestable properties
    this.dropTable = this.generateDropTable();
  }

  takeDamage(damage: any): any {
    // Basic damage implementation - could be enhanced
    const actualDamage = Math.max(1, damage.amount - this.genetics.resilience * 5);
    this.health.currentHealth = Math.max(0, this.health.currentHealth - actualDamage);
    this.health.lastDamageTime = Date.now();

    return {
      damageDealt: actualDamage,
      blocked: damage.amount - actualDamage,
      killed: this.health.currentHealth === 0,
      effects: [],
      knockback: { x: 0, y: 0 },
    };
  }

  onDestruction(): void {
    // Handle plant death - could spread seeds, create compost, etc.
    console.log(`${this.species.name} at (${this.position.x}, ${this.position.y}) has died`);
  }

  getVisualDamageState(): any {
    const healthPercent = this.health.currentHealth / this.health.maxHealth;
    if (healthPercent >= 0.8) return "pristine";
    if (healthPercent >= 0.6) return "light";
    if (healthPercent >= 0.4) return "damaged";
    if (healthPercent >= 0.2) return "heavy";
    if (healthPercent > 0) return "critical";
    return "destroyed";
  }

  private generateGeneticColor(): string {
    // Generate a variation of the base species color
    const baseHue = parseInt(this.species.appearance.baseColor.match(/\d+/)?.[0] || "120");
    const variation = Math.random() * 40 - 20; // ±20 degrees hue variation
    const newHue = (baseHue + variation + 360) % 360;
    return `hsl(${newHue}, 70%, 50%)`;
  }

  private generateDropTable(): DropTable {
    const guaranteed = this.species.harvestable.resources
      .filter(resource => resource.probability >= 1.0)
      .map(resource => ({
        itemType: resource.itemType,
        minQuantity: Math.floor(resource.baseQuantity * this.genetics.yieldBonus),
        maxQuantity: Math.ceil(resource.baseQuantity * this.genetics.yieldBonus * 1.2),
        probability: 1.0,
      }));

    const possible = this.species.harvestable.resources
      .filter(resource => resource.probability < 1.0 && resource.probability > 0.1)
      .map(resource => ({
        itemType: resource.itemType,
        minQuantity: Math.floor(resource.baseQuantity * this.genetics.yieldBonus),
        maxQuantity: Math.ceil(resource.baseQuantity * this.genetics.yieldBonus * 1.2),
        probability: resource.probability,
      }));

    const rare = this.species.harvestable.resources
      .filter(resource => resource.probability <= 0.1)
      .map(resource => ({
        itemType: resource.itemType,
        minQuantity: Math.floor(resource.baseQuantity * this.genetics.yieldBonus),
        maxQuantity: Math.ceil(resource.baseQuantity * this.genetics.yieldBonus * 1.2),
        probability: resource.probability,
      }));

    return {
      guaranteed,
      possible,
      rare,
      modifiers: [],
    };
  }
}