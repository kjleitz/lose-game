import { GameMode, type GameModeState, type PlanetModeState, type GameModeType } from "./GameMode";
import type { Player } from "../player";
import type { GameSession } from "../GameSession";
import type { Planet } from "../planets";
import { setCameraPosition } from "../../render/camera";

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

export interface Creature {
  id: string;
  x: number;
  y: number;
  type: "passive" | "neutral" | "hostile";
  health: number;
  radius: number;
}

export class PlanetMode extends GameMode {
  readonly type = "planet" as const;

  private currentPlanet?: Planet;
  private surface?: PlanetSurface;
  private landingSite = { x: 0, y: 0 };

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

    // Update player with planet physics
    player.updatePlanet(dt, actions);

    // Set camera to follow player on planet surface
    setCameraPosition(session.camera, player.state.x, player.state.y);

    // Check for resource collection
    this.checkResourceCollection(player);

    // Update creatures (basic for now)
    this.updateCreatures(dt);

    // Set notification
    session.notification = `Exploring ${this.currentPlanet.id} - Press T to takeoff`;
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

  private generatePlanetSurface(planet: Planet): void {
    // Simple procedural planet surface generation
    const terrain: TerrainFeature[] = [];
    const resources: Resource[] = [];
    const creatures: Creature[] = [];

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

      terrain.push({
        id: `terrain-${i}`,
        x,
        y,
        type: Math.random() > 0.5 ? "rock" : "vegetation",
        size: 20 + Math.random() * 30,
      });
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

      const creatureTypes: Creature["type"][] = ["passive", "neutral", "hostile"];
      creatures.push({
        id: `creature-${i}`,
        x,
        y,
        type: creatureTypes[Math.floor(Math.random() * creatureTypes.length)],
        health: 50 + Math.floor(Math.random() * 50),
        radius: 15 + Math.random() * 10,
      });
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
}
