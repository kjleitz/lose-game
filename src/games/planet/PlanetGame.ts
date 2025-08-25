import type { Game, GameState, TransitionData, GameEngine } from "../../shared/types/Game";
import type { Player } from "../../domain/game/player";
import type { Planet } from "../../domain/game/planets";
// import { setCameraPosition } from "../../domain/render/camera"; // TODO: Remove when camera system is extracted

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

export interface PlanetGameState extends GameState {
  planetId: string;
  playerPosition: { x: number; y: number };
  exploredAreas: Set<string>;
  surface?: PlanetSurface;
}

export class PlanetGame implements Game {
  readonly name = "planet";
  readonly version = "1.0.0";

  private currentPlanet?: Planet;
  private surface?: PlanetSurface;
  private landingSite = { x: 0, y: 0 };
  private player?: Player;
  private engine?: GameEngine;

  // Callback for requesting mode transitions (will be set by GameManager)
  private onModeTransition?: (targetMode: string, data?: unknown) => void;

  initialize(engine: GameEngine): void {
    this.engine = engine;
  }

  update(dt: number): void {
    if (!this.engine || !this.player) return;

    const actions = this.engine.input.actions;

    if (!this.currentPlanet || !this.surface) {
      console.warn("PlanetMode active but no planet loaded");
      return;
    }

    // Handle takeoff action
    if (actions.has("takeoff")) {
      this.onModeTransition?.("space", {
        returnPosition: this.calculateSpaceReturnPosition(),
      });
      return;
    }

    // Update player with planet physics
    this.player.updatePlanet(dt, actions);

    // Check for resource collection
    this.checkResourceCollection();

    // Update creatures (basic for now)
    this.updateCreatures(dt);
  }

  render(): void {
    // Rendering will be handled by the GameRenderer for now
    // In future iterations, this would manage planet-specific rendering
  }

  cleanup(): void {
    // Cleanup resources if needed
  }

  saveState(): PlanetGameState {
    return {
      planetId: this.currentPlanet?.id ?? "",
      playerPosition: { x: this.player?.state.x ?? 0, y: this.player?.state.y ?? 0 },
      exploredAreas: new Set(),
      surface: this.surface,
    };
  }

  loadState(state: GameState): void {
    const planetState = state as PlanetGameState;
    if (planetState.surface) {
      this.surface = planetState.surface;
    }
  }

  canTransitionTo(targetGame: string): boolean {
    return targetGame === "space";
  }

  prepareTransition(targetGame: string): TransitionData {
    if (targetGame === "space") {
      return {
        returnPosition: this.calculateSpaceReturnPosition(),
      };
    }
    return {};
  }

  receiveTransition(data: TransitionData): void {
    // Handle landing from space mode
    const planet = data.planet as Planet | undefined;
    
    if (planet) {
      this.landOnPlanet(planet);
    }
  }

  // Public API for backward compatibility
  landOnPlanet(planet: Planet): void {
    if (!this.player) return;
    
    this.currentPlanet = planet;
    this.generatePlanetSurface(planet);

    // Position player at landing site
    this.player.state.x = this.landingSite.x;
    this.player.state.y = this.landingSite.y;
    this.player.state.vx = 0;
    this.player.state.vy = 0;
  }

  get planetData(): Planet | undefined {
    return this.currentPlanet;
  }

  get surfaceData(): PlanetSurface | undefined {
    return this.surface;
  }

  setPlayer(player: Player): void {
    this.player = player;
  }

  setModeTransitionCallback(callback: (targetMode: string, data?: unknown) => void): void {
    this.onModeTransition = callback;
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

  private checkResourceCollection(): void {
    if (!this.surface || !this.player) return;

    for (let i = this.surface.resources.length - 1; i >= 0; i--) {
      const resource = this.surface.resources[i];
      const distance = Math.hypot(this.player.state.x - resource.x, this.player.state.y - resource.y);

      if (distance < 30) {
        // Collection radius
        // Remove resource and give experience
        this.surface.resources.splice(i, 1);
        this.player.state.experience = (this.player.state.experience ?? 0) + resource.amount;
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