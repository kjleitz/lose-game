import type {
  FloraInstance,
  GrowthStage,
  ReproductionRequirement,
  OffspringProperties,
  GeneticTraits,
} from "./FloraSpecies";

export class FloraGrowthSystem {
  private instances: Map<string, FloraInstance> = new Map();

  addPlant(plant: FloraInstance): void {
    this.instances.set(plant.id, plant);
  }

  removePlant(plantId: string): void {
    this.instances.delete(plantId);
  }

  getPlant(plantId: string): FloraInstance | undefined {
    return this.instances.get(plantId);
  }

  getAllPlants(): FloraInstance[] {
    return Array.from(this.instances.values());
  }

  update(dt: number): void {
    for (const plant of this.instances.values()) {
      this.updatePlantGrowth(plant, dt);
      this.updatePlantHealth(plant, dt);
      this.updatePlantDisease(plant, dt);
    }

    // Handle reproduction and spreading
    this.handleReproduction(dt);
  }

  private updatePlantGrowth(plant: FloraInstance, dt: number): void {
    if (plant.health.currentHealth <= 0) {
      return; // Dead plants don't grow
    }

    const species = plant.species;
    const timeSinceLastUpdate = dt / 3600; // convert seconds -> hours

    // Calculate growth rate based on environmental factors
    const environmentalGrowthRate = this.calculateEnvironmentalGrowthRate(plant);
    const geneticGrowthRate = plant.genetics.growthRate;
    const finalGrowthRate =
      species.growth.baseGrowthRate * environmentalGrowthRate * geneticGrowthRate;

    // Update age
    plant.age += timeSinceLastUpdate * finalGrowthRate;
    // lastGrowthUpdate is retained for compatibility; simulated via dt
    plant.lastGrowthUpdate = plant.lastGrowthUpdate + dt * 1000; // approx simulation timestamp

    // Check for stage progression
    const newStage = this.calculateGrowthStage(plant);
    if (newStage.id !== plant.currentStage) {
      this.advanceGrowthStage(plant, newStage);
    }

    // Update size based on stage and genetics
    this.updatePlantSize(plant);
  }

  private calculateEnvironmentalGrowthRate(plant: FloraInstance): number {
    const habitat = plant.species.habitat;
    let growthRate = 1.0;

    // Temperature factor
    const temperature = plant.environmentalFactors.get("temperature") || 0.5;
    const tempOptimal = (habitat.minTemperature + habitat.maxTemperature) / 2;
    const tempDeviation = Math.abs(temperature - tempOptimal);
    const tempFactor = Math.max(0.1, 1.0 - tempDeviation * 2);
    growthRate *= tempFactor;

    // Moisture factor
    const moisture = plant.environmentalFactors.get("moisture") || 0.5;
    const moistureOptimal = (habitat.minMoisture + habitat.maxMoisture) / 2;
    const moistureDeviation = Math.abs(moisture - moistureOptimal);
    const moistureFactor = Math.max(0.1, 1.0 - moistureDeviation * 2);
    growthRate *= moistureFactor;

    // Light factor
    const lightLevel = plant.environmentalFactors.get("light") || 0.5;
    const lightRequirement = this.getLightLevelValue(habitat.lightRequirement);
    const lightDeviation = Math.abs(lightLevel - lightRequirement);
    const lightFactor = Math.max(0.2, 1.0 - lightDeviation);
    growthRate *= lightFactor;

    // Nutrient factor
    const nutrientFactor = Math.max(0.3, plant.nutrients);
    growthRate *= nutrientFactor;

    // Water factor
    const waterFactor = Math.max(0.2, plant.waterLevel);
    growthRate *= waterFactor;

    // Disease factor
    const diseaseFactor = this.calculateDiseaseFactor(plant);
    growthRate *= diseaseFactor;

    return Math.max(0.01, growthRate); // Never stop growing completely
  }

  private getLightLevelValue(lightLevel: string): number {
    switch (lightLevel) {
      case "full_shade":
        return 0.1;
      case "partial_shade":
        return 0.3;
      case "dappled_light":
        return 0.5;
      case "partial_sun":
        return 0.7;
      case "full_sun":
        return 0.9;
      default:
        return 0.5;
    }
  }

  private calculateDiseaseFactor(plant: FloraInstance): number {
    if (plant.diseases.length === 0) return 1.0;

    let totalSeverity = 0;
    for (const disease of plant.diseases) {
      totalSeverity += disease.severity;
    }

    const averageSeverity = totalSeverity / plant.diseases.length;
    return Math.max(0.2, 1.0 - averageSeverity * 0.5);
  }

  private calculateGrowthStage(plant: FloraInstance): GrowthStage {
    const stages = plant.species.growth.stages;
    let currentStageIndex = 0;

    // Find current stage based on age
    for (let i = 0; i < stages.length; i++) {
      if (plant.age >= stages[i].requirements.minAge) {
        currentStageIndex = i;
      } else {
        break;
      }
    }

    return stages[currentStageIndex];
  }

  private advanceGrowthStage(plant: FloraInstance, newStage: GrowthStage): void {
    console.log(`${plant.species.name} advanced to ${newStage.name} stage`);
    plant.currentStage = newStage.id;

    // Update health based on new stage
    if (newStage.name === "mature" || newStage.name === "elder") {
      const healthBonus = 20 * plant.genetics.resilience;
      plant.health.maxHealth += healthBonus;
      plant.health.currentHealth += healthBonus;
    }
  }

  private updatePlantSize(plant: FloraInstance): void {
    const stage = plant.species.growth.stages.find((s) => s.id === plant.currentStage);
    if (!stage) return;

    const baseSize = plant.species.growth.maxSize;
    const stageSize = stage.appearance.size;
    const geneticSize = plant.genetics.size;

    // Calculate current size (stored in environmental factors for rendering)
    const currentSize = baseSize * stageSize * geneticSize;
    plant.environmentalFactors.set("size", currentSize);
  }

  private updatePlantHealth(plant: FloraInstance, dt: number): void {
    // Natural regeneration
    if (plant.health.regeneration > 0 && plant.health.currentHealth > 0) {
      const regenAmount = plant.health.regeneration * dt * plant.genetics.resilience;
      plant.health.currentHealth = Math.min(
        plant.health.maxHealth,
        plant.health.currentHealth + regenAmount,
      );
    }

    // Environmental damage
    this.checkEnvironmentalDamage(plant, dt);
  }

  private checkEnvironmentalDamage(plant: FloraInstance, dt: number): void {
    const species = plant.species;
    const habitat = species.habitat;

    // Temperature damage
    const temperature = plant.environmentalFactors.get("temperature") || 0.5;
    if (temperature < habitat.minTemperature || temperature > habitat.maxTemperature) {
      const temperatureDamage =
        Math.abs(temperature - (habitat.minTemperature + habitat.maxTemperature) / 2) * 10 * dt;
      const resistance = species.resilience.frostTolerance; // or heat tolerance
      plant.health.currentHealth -= temperatureDamage * (1 - resistance);
    }

    // Drought damage
    if (plant.waterLevel < 0.2) {
      const droughtDamage = (0.2 - plant.waterLevel) * 5 * dt;
      const resistance = species.resilience.droughtTolerance;
      plant.health.currentHealth -= droughtDamage * (1 - resistance);
    }

    // Disease damage
    for (const disease of plant.diseases) {
      const diseaseDamage = disease.severity * 2 * dt;
      const resistance = species.resilience.diseaseResistance;
      plant.health.currentHealth -= diseaseDamage * (1 - resistance);
    }

    // Clamp health
    plant.health.currentHealth = Math.max(0, plant.health.currentHealth);
  }

  private updatePlantDisease(plant: FloraInstance, dt: number): void {
    // Update existing diseases
    for (let i = plant.diseases.length - 1; i >= 0; i--) {
      const disease = plant.diseases[i];

      // Disease progression
      disease.severity += disease.progression * dt;

      // Disease recovery based on plant resilience
      const recovery = plant.genetics.resilience * 0.1 * dt;
      disease.severity = Math.max(0, disease.severity - recovery);

      // Remove cured diseases
      if (disease.severity <= 0) {
        plant.diseases.splice(i, 1);
      }
    }

    // Chance for new diseases based on environmental stress
    const stressFactor = this.calculateStressFactor(plant);
    const diseaseChance = stressFactor * 0.001 * dt; // 0.1% per second when stressed

    if (Math.random() < diseaseChance) {
      this.infectPlant(plant);
    }
  }

  private calculateStressFactor(plant: FloraInstance): number {
    const habitat = plant.species.habitat;
    let stress = 0;

    // Environmental stress
    const temperature = plant.environmentalFactors.get("temperature") || 0.5;
    if (temperature < habitat.minTemperature || temperature > habitat.maxTemperature) {
      stress += 1.0;
    }

    // Nutrient stress
    if (plant.nutrients < 0.3) {
      stress += (0.3 - plant.nutrients) * 2;
    }

    // Water stress
    if (plant.waterLevel < 0.3) {
      stress += (0.3 - plant.waterLevel) * 2;
    }

    // Overcrowding stress (simplified)
    const nearbyPlants = this.findNearbyPlants(plant, 5);
    if (nearbyPlants.length > 3) {
      stress += (nearbyPlants.length - 3) * 0.2;
    }

    return Math.min(2.0, stress);
  }

  private infectPlant(plant: FloraInstance): void {
    const commonDiseases = [
      "fungal_blight",
      "leaf_spot",
      "root_rot",
      "viral_mosaic",
      "bacterial_wilt",
    ];

    const diseaseType = commonDiseases[Math.floor(Math.random() * commonDiseases.length)];
    const severity = 0.1 + Math.random() * 0.2; // Start with low severity

    plant.diseases.push({
      type: diseaseType,
      severity,
      progression: 0.1 + Math.random() * 0.1,
      effects: this.getDiseaseEffects(diseaseType),
    });

    console.log(`${plant.species.name} infected with ${diseaseType}`);
  }

  private getDiseaseEffects(diseaseType: string): import("./FloraSpecies").DiseaseEffect[] {
    switch (diseaseType) {
      case "fungal_blight":
        return [
          { type: "growth_slow", intensity: 0.5 },
          { type: "appearance_change", intensity: 0.3 },
        ];
      case "leaf_spot":
        return [
          { type: "yield_reduce", intensity: 0.3 },
          { type: "appearance_change", intensity: 0.4 },
        ];
      case "root_rot":
        return [
          { type: "nutrient_absorption_reduce", intensity: 0.6 },
          { type: "growth_slow", intensity: 0.4 },
        ];
      default:
        return [{ type: "growth_slow", intensity: 0.3 }];
    }
  }

  private handleReproduction(dt: number): void {
    const reproductiveAge = 0.6; // 60% of max age to start reproducing

    for (const plant of this.instances.values()) {
      if (plant.health.currentHealth <= 0) continue;

      const species = plant.species;
      const ageRatio = plant.age / species.growth.maxAge;

      if (ageRatio >= reproductiveAge) {
        const reproductionChance = species.reproduction.frequency * dt * 0.1; // Per hour

        if (Math.random() < reproductionChance) {
          this.attemptReproduction(plant);
        }
      }
    }
  }

  private attemptReproduction(parent: FloraInstance): void {
    const species = parent.species;
    const reproduction = species.reproduction;

    // Check reproduction requirements
    let canReproduce = true;
    for (const req of reproduction.requirements) {
      if (!this.meetsReproductionRequirement(parent, req)) {
        canReproduce = false;
        break;
      }
    }

    if (!canReproduce) return;

    // Generate offspring
    const offspringCount = Math.floor(
      reproduction.offspring.count[0] +
        Math.random() * (reproduction.offspring.count[1] - reproduction.offspring.count[0]),
    );

    for (let i = 0; i < offspringCount; i++) {
      if (Math.random() < reproduction.offspring.survivalRate) {
        this.createOffspring(parent, reproduction.offspring);
      }
    }

    console.log(`${species.name} reproduced, creating ${offspringCount} offspring`);
  }

  private meetsReproductionRequirement(
    plant: FloraInstance,
    requirement: ReproductionRequirement,
  ): boolean {
    switch (requirement.type) {
      case "health":
        return plant.health.currentHealth / plant.health.maxHealth >= requirement.value;
      case "nutrients":
        return plant.nutrients >= requirement.value;
      case "water":
        return plant.waterLevel >= requirement.value;
      case "companions": {
        const nearbyCompanions = this.findNearbyCompanions(plant);
        return nearbyCompanions.length >= requirement.value;
      }
      default:
        return true;
    }
  }

  private createOffspring(parent: FloraInstance, offspringProps: OffspringProperties): void {
    const dispersalDistance = offspringProps.dispersalDistance;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * dispersalDistance;

    const newPosition = {
      x: parent.position.x + Math.cos(angle) * distance,
      y: parent.position.y + Math.sin(angle) * distance,
    };

    // Genetic variation
    let genetics: GeneticTraits = { ...parent.genetics };
    if (Math.random() < offspringProps.mutationChance) {
      genetics = this.applyGenericMutation(genetics);
    }

    // Create new plant instance by cloning the parent and updating its properties
    const offspring = this.cloneFloraInstance(parent, newPosition, genetics);

    // Offspring start young
    offspring.age = 0;
    offspring.currentStage = parent.species.growth.stages[0].id;

    this.addPlant(offspring);
  }

  private applyGenericMutation(genetics: GeneticTraits): GeneticTraits {
    const mutated: GeneticTraits = { ...genetics };
    const traits: Array<keyof GeneticTraits> = ["growthRate", "size", "yieldBonus", "resilience"];
    const traitToMutate = traits[Math.floor(Math.random() * traits.length)];

    // Apply small mutation
    const mutation = (Math.random() - 0.5) * 0.2; // ±10% change
    this.mutateGeneticTrait(mutated, traitToMutate, mutation);

    return mutated;
  }

  private findNearbyPlants(plant: FloraInstance, radius: number): FloraInstance[] {
    const nearby: FloraInstance[] = [];

    for (const other of this.instances.values()) {
      if (other.id === plant.id) continue;

      const distance = Math.hypot(
        plant.position.x - other.position.x,
        plant.position.y - other.position.y,
      );

      if (distance <= radius) {
        nearby.push(other);
      }
    }

    return nearby;
  }

  private findNearbyCompanions(plant: FloraInstance): FloraInstance[] {
    const companions = plant.species.habitat.companionSpecies || [];
    if (companions.length === 0) return [];

    const nearby = this.findNearbyPlants(plant, 10);
    return nearby.filter((other) => companions.includes(other.species.id));
  }

  // Environmental update methods
  updateEnvironmentalFactors(plant: FloraInstance, factors: Map<string, number>): void {
    for (const [key, value] of factors) {
      plant.environmentalFactors.set(key, value);
    }
  }

  updateNutrientLevels(plant: FloraInstance, nutrients: number): void {
    plant.nutrients = Math.max(0, Math.min(1, nutrients));
  }

  updateWaterLevels(plant: FloraInstance, water: number): void {
    plant.waterLevel = Math.max(0, Math.min(1, water));
  }

  private cloneFloraInstance(
    parent: FloraInstance,
    newPosition: { x: number; y: number },
    genetics: GeneticTraits,
  ): FloraInstance {
    // For now, we'll use Object.create to clone the instance without constructor casting
    const offspring = Object.create(Object.getPrototypeOf(parent));

    // Copy all properties from parent
    Object.assign(offspring, parent);

    // Update with new values
    offspring.id = `plant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    offspring.position = newPosition;
    offspring.genetics = genetics;

    return offspring;
  }

  private mutateGeneticTrait(
    genetics: GeneticTraits,
    traitName: keyof GeneticTraits,
    mutation: number,
  ): void {
    switch (traitName) {
      case "growthRate":
        genetics.growthRate = Math.max(0.1, genetics.growthRate + mutation);
        break;
      case "size":
        genetics.size = Math.max(0.1, genetics.size + mutation);
        break;
      case "yieldBonus":
        genetics.yieldBonus = Math.max(0.1, genetics.yieldBonus + mutation);
        break;
      case "resilience":
        genetics.resilience = Math.max(0.1, genetics.resilience + mutation);
        break;
      case "color":
        // no-op; color is not mutated numerically here
        break;
    }
  }
}
