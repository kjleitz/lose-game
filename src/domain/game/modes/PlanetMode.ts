import { GameMode, type GameModeState, type PlanetModeState, type GameModeType } from "./GameMode";
import type { Player } from "../player";
import type { GameSession } from "../GameSession";
import type { Planet } from "../planets";
import { setCameraPosition } from "../../render/camera";
import { WeaponSystem } from "../weapons/WeaponSystem";
import { FloraInstanceImpl } from "../flora/FloraSpecies";
import { FloraTemplates } from "../flora/FloraTemplates";
import type { DamageableEntity } from "../damage/DamageableEntity";
import { DamageType, DamageVisualState } from "../damage/DamageableEntity";
import { DroppedItemSystem } from "../items/DroppedItemSystem";
import { EntityDeathRenderer } from "../../render/EntityDeathRenderer";

export interface PlanetSurface {
  planetId: string;
  landingSite: { x: number; y: number };
  terrain: TerrainFeature[];
  resources: Resource[];
  creatures: Creature[];
}

export interface TerrainFeature {
  id: string;
  x: number;
  y: number;
  type: "rock" | "vegetation" | "structure";
  size: number;
}

export interface Resource {
  id: string;
  x: number;
  y: number;
  type: "mineral" | "energy" | "organic";
  amount: number;
}

export interface Creature extends DamageableEntity {
  id: string;
  x: number;
  y: number;
  type: "passive" | "neutral" | "hostile";
  radius: number;
}

export class PlanetMode extends GameMode {
  readonly type = "planet" as const;

  private currentPlanet?: Planet;
  private surface?: PlanetSurface;
  private landingSite = { x: 0, y: 0 };
  private weaponSystem = new WeaponSystem();
  private droppedItemSystem = new DroppedItemSystem();
  private deathRenderer = new EntityDeathRenderer();
  private floraTemplates = new FloraTemplates();
  private damageableEntities: DamageableEntity[] = [];

  constructor() {
    super();
  }

  update(dt: number, actions: Set<string>, player: Player, session: GameSession): void {
    if (!this.currentPlanet || !this.surface) {
      console.warn("PlanetMode active but no planet loaded");
      return;
    }

    // Handle takeoff action
    if (actions.has("takeoff")) {
      session.requestModeTransition("space", {
        returnPosition: this.calculateSpaceReturnPosition(),
      });
      return;
    }

    // Handle weapon firing
    if (actions.has("fire")) {
      this.handleWeaponFire(player, session);
    }

    // Update player with planet physics
    player.updatePlanet(dt, actions);

    // Set camera to follow player on planet surface
    setCameraPosition(session.camera, player.state.x, player.state.y);

    // Handle interaction/pickup action
    if (actions.has("interact")) {
      this.handlePickupAttempt(player);
    }

    // Update weapon system and projectiles
    this.weaponSystem.update(dt, this.damageableEntities);

    // Update dropped items system
    this.droppedItemSystem.update(dt);

    // Update death renderer
    this.deathRenderer.update(dt);

    // Check for resource collection
    this.checkResourceCollection(player);

    // Update creatures (basic for now)
    this.updateCreatures(dt);

    // Remove dead entities (this now also handles drops)
    this.removeDeadEntities();

    // Set notification
    const projectileCount = this.weaponSystem.getAllProjectiles().length;
    const entityCount = this.damageableEntities.length;
    session.notification = `Exploring ${this.currentPlanet.id} - Press T to takeoff, F to fire (${projectileCount} shots, ${entityCount} entities)`;
  }

  canTransitionTo(mode: GameModeType): boolean {
    return mode === "space";
  }

  saveState(): PlanetModeState {
    return {
      type: "planet",
      planetId: this.currentPlanet?.id ?? "",
      playerPosition: { x: 0, y: 0 }, // Will be set by GameSession
      exploredAreas: new Set(),
    };
  }

  loadState(state: GameModeState): void {
    if (state.type !== "planet") {
      throw new Error(`Cannot load ${state.type} state into PlanetMode`);
    }
    // Restore planet-specific state
  }

  getRequiredHudComponents(): string[] {
    return ["HealthBar", "ExperienceBar", "ActionReadout"];
  }

  // Getters for rendering systems
  getDroppedItemSystem(): DroppedItemSystem {
    return this.droppedItemSystem;
  }

  getDeathRenderer(): EntityDeathRenderer {
    return this.deathRenderer;
  }

  // Planet-specific methods
  landOnPlanet(planet: Planet, player: Player): void {
    this.currentPlanet = planet;
    this.generatePlanetSurface(planet);

    // Position player at landing site
    player.state.x = this.landingSite.x;
    player.state.y = this.landingSite.y;
    player.state.vx = 0;
    player.state.vy = 0;
  }

  get planetData(): Planet | undefined {
    return this.currentPlanet;
  }

  get surfaceData(): PlanetSurface | undefined {
    return this.surface;
  }

  get weaponSystemData(): WeaponSystem {
    return this.weaponSystem;
  }

  private handleWeaponFire(player: Player, _session: GameSession): void {
    const weapon = this.weaponSystem.getEquippedWeapon(player);
    if (!weapon) {
      return;
    }

    // Simple target: shoot in the direction player is facing
    const targetDistance = 200; // Distance ahead of player
    const targetX = player.state.x + Math.cos(player.state.angle) * targetDistance;
    const targetY = player.state.y + Math.sin(player.state.angle) * targetDistance;

    const result = this.weaponSystem.fireWeapon(player, weapon, targetX, targetY);

    if (!result.success && result.reason) {
      // Could add a notification system here later
      console.log(`Weapon fire failed: ${result.reason}`);
    }
  }

  private removeDeadEntities(): void {
    this.damageableEntities = this.damageableEntities.filter((entity) => {
      if (entity.health.currentHealth <= 0) {
        // Handle entity death
        this.handleEntityDeath(entity);
        entity.onDestruction();
        return false;
      }
      return true;
    });
  }

  private handleEntityDeath(entity: DamageableEntity): void {
    // Drop items from the entity
    const droppedItems = this.droppedItemSystem.dropItemsFromEntity(entity, entity.position);

    // Add visual death effect
    const entityType = this.getEntityType(entity);
    const size = this.getEntitySize(entity);
    this.deathRenderer.addDeadEntity(
      entity.id,
      entity.position.x,
      entity.position.y,
      entityType,
      size,
    );

    // Log for debugging
    if (droppedItems.length > 0) {
      console.log(`Entity ${entity.id} dropped ${droppedItems.length} items`);
    }
  }

  private handlePickupAttempt(player: Player): void {
    const pickupResults = this.droppedItemSystem.tryPickupNearbyItems(player);

    if (pickupResults.length > 0) {
      const totalItems = pickupResults.reduce((sum, result) => sum + (result.quantity || 0), 0);
      console.log(`Picked up ${totalItems} items`);

      // Could add notification system here
      // session.addNotification(`Picked up ${totalItems} items`);
    }
  }

  private getEntityType(entity: DamageableEntity): string {
    // Try to determine entity type from its ID or properties
    if (entity.id.includes("creature")) return "creature";
    if (entity.id.includes("plant") || entity.id.includes("flora")) return "plant";
    if (entity.id.includes("robot") || entity.id.includes("mech")) return "robot";
    return "unknown";
  }

  private getEntitySize(_entity: DamageableEntity): number {
    // Default size, could be enhanced with actual entity size data
    return 20;
  }

  private generatePlanetSurface(planet: Planet): void {
    // Simple procedural planet surface generation
    const terrain: TerrainFeature[] = [];
    const resources: Resource[] = [];
    const creatures: Creature[] = [];

    // Clear damageable entities from previous generation
    this.damageableEntities = [];

    // Generate landing site (clear area) - use planet's position as reference
    // But for planet surface exploration, we want coordinates relative to the landing site
    this.landingSite = { x: 0, y: 0 };

    // Generate random terrain features around the landing site
    const numFeatures = Math.floor(Math.random() * 10) + 5;
    for (let i = 0; i < numFeatures; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 300;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const featureType = Math.random() > 0.5 ? "rock" : "vegetation";
      terrain.push({
        id: `terrain-${i}`,
        x,
        y,
        type: featureType,
        size: 20 + Math.random() * 30,
      });

      // Generate flora for vegetation features
      if (featureType === "vegetation") {
        const speciesType = Math.random() > 0.5 ? "oak_tree" : "berry_bush";
        const species = this.floraTemplates.getSpecies(speciesType);
        if (species) {
          const floraInstance = new FloraInstanceImpl(`flora_${i}`, { x, y }, species);
          this.damageableEntities.push(floraInstance);
        }
      }
    }

    // Generate some resources
    const numResources = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < numResources; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 200;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const resourceTypes: Resource["type"][] = ["mineral", "energy", "organic"];
      resources.push({
        id: `resource-${i}`,
        x,
        y,
        type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        amount: Math.floor(Math.random() * 50) + 10,
      });
    }

    // Generate a few creatures
    const numCreatures = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numCreatures; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 150 + Math.random() * 250;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      const creatureTypes: ("passive" | "neutral" | "hostile")[] = [
        "passive",
        "neutral",
        "hostile",
      ];
      const creatureType = creatureTypes[Math.floor(Math.random() * creatureTypes.length)];

      // Create creature as damageable entity
      const creature = this.createDamageableCreature(`creature-${i}`, x, y, creatureType);
      creatures.push(creature);
      this.damageableEntities.push(creature);
    }

    this.surface = {
      planetId: planet.id,
      landingSite: this.landingSite,
      terrain,
      resources,
      creatures,
    };
  }

  private checkResourceCollection(player: Player): void {
    if (!this.surface) return;

    for (let i = this.surface.resources.length - 1; i >= 0; i--) {
      const resource = this.surface.resources[i];
      const distance = Math.hypot(player.state.x - resource.x, player.state.y - resource.y);

      if (distance < 30) {
        // Collection radius
        // Remove resource and give experience
        this.surface.resources.splice(i, 1);
        player.state.experience = (player.state.experience ?? 0) + resource.amount;
      }
    }
  }

  private updateCreatures(dt: number): void {
    if (!this.surface) return;

    // Basic creature movement (just random walk for now)
    for (const creature of this.surface.creatures) {
      if (Math.random() < 0.02) {
        // 2% chance to change direction each frame
        const angle = Math.random() * Math.PI * 2;
        const speed = 30; // slow movement
        creature.x += Math.cos(angle) * speed * dt;
        creature.y += Math.sin(angle) * speed * dt;
      }
    }
  }

  private calculateSpaceReturnPosition(): { x: number; y: number } {
    if (!this.currentPlanet) {
      return { x: 0, y: 0 };
    }

    // Position ship just outside planet atmosphere, on the side closest to where the player landed
    // This gives a more intuitive takeoff experience
    const angle = Math.random() * Math.PI * 2;
    const distance = this.currentPlanet.radius + 80;

    return {
      x: this.currentPlanet.x + Math.cos(angle) * distance,
      y: this.currentPlanet.y + Math.sin(angle) * distance,
    };
  }

  private createDamageableCreature(
    id: string,
    x: number,
    y: number,
    type: "passive" | "neutral" | "hostile",
  ): Creature {
    const baseHealth = type === "passive" ? 30 : type === "neutral" ? 50 : 80;
    const health = baseHealth + Math.floor(Math.random() * 30);

    return {
      id,
      x,
      y,
      type,
      radius: 15 + Math.random() * 10,
      position: { x, y },
      health: {
        maxHealth: health,
        currentHealth: health,
        resistances: new Map([
          ["physical" as DamageType, type === "hostile" ? 0.2 : 0.1],
          ["energy" as DamageType, type === "passive" ? 0.3 : 0.1],
        ]),
        vulnerabilities: new Map(),
        regeneration: type === "passive" ? 2 : 0.5,
        invulnerabilityPeriod: 500,
        lastDamageTime: 0,
      },
      dropTable: {
        guaranteed: [
          { itemType: "organic_matter", minQuantity: 1, maxQuantity: 3, probability: 1.0 },
        ],
        possible: [{ itemType: "alien_hide", minQuantity: 1, maxQuantity: 2, probability: 0.6 }],
        rare: [{ itemType: "rare_essence", minQuantity: 1, maxQuantity: 1, probability: 0.1 }],
        modifiers: [],
      },
      destructionEffect: {
        particles: [
          {
            type: type === "hostile" ? "blood_splatter" : "sparkle",
            count: 10,
            velocity: { x: 0, y: 0 },
            color: type === "hostile" ? "#ff0000" : "#00ff00",
          },
        ],
        sound: "creature_death",
        duration: 1000,
      },
      takeDamage: function (damage) {
        const now = Date.now();

        // Check invulnerability period
        if (now - this.health.lastDamageTime < this.health.invulnerabilityPeriod) {
          return {
            damageDealt: 0,
            blocked: damage.amount,
            killed: false,
            effects: [],
            knockback: { x: 0, y: 0 },
          };
        }

        // Calculate actual damage
        const resistance = this.health.resistances.get(damage.type) || 0;
        const vulnerability = this.health.vulnerabilities.get(damage.type) || 0;
        const modifier = 1 - resistance + vulnerability;

        let actualDamage = Math.max(1, Math.floor(damage.amount * modifier));
        if (damage.critical) {
          actualDamage = Math.floor(actualDamage * 1.5);
        }

        this.health.currentHealth = Math.max(0, this.health.currentHealth - actualDamage);
        this.health.lastDamageTime = now;

        // Simple knockback based on damage direction
        const knockback = { x: Math.random() * 20 - 10, y: Math.random() * 20 - 10 };

        return {
          damageDealt: actualDamage,
          blocked: damage.amount - actualDamage,
          killed: this.health.currentHealth === 0,
          effects: [],
          knockback,
        };
      },
      onDestruction: function () {
        console.log(`${this.type} creature ${this.id} has been defeated!`);
      },
      getVisualDamageState: function (): DamageVisualState {
        const healthPercent = this.health.currentHealth / this.health.maxHealth;
        if (healthPercent >= 0.8) return DamageVisualState.PRISTINE;
        if (healthPercent >= 0.6) return DamageVisualState.LIGHTLY_DAMAGED;
        if (healthPercent >= 0.4) return DamageVisualState.DAMAGED;
        if (healthPercent >= 0.2) return DamageVisualState.HEAVILY_DAMAGED;
        if (healthPercent > 0) return DamageVisualState.CRITICAL;
        return DamageVisualState.DESTROYED;
      },
    };
  }
}
