import type { Player } from "./player";
import type { Planet } from "./planets";
import type { Enemy } from "./enemies";
import type { GameModeType } from "./modes/GameMode";
import { GameMode } from "./modes/GameMode";
import { SpaceMode } from "./modes/SpaceMode";
import { PlanetMode } from "./modes/PlanetMode";
import { ModeTransitionManager } from "./modes/ModeTransition";

export class GameSession {
  camera: { x: number; y: number; zoom: number };
  player: Player;
  size: { width: number; height: number };
  notification: string | null = null;

  private currentMode: GameMode;
  private spaceMode: SpaceMode;
  private planetMode: PlanetMode;
  private transitionManager: ModeTransitionManager;

  constructor({
    camera,
    player,
    planets,
    size,
    enemies,
  }: {
    camera: { x: number; y: number; zoom: number };
    player: Player;
    planets: Planet[];
    size: { width: number; height: number };
    enemies?: Enemy[];
  }) {
    this.camera = camera;
    this.player = player;
    this.size = size;

    // Initialize game modes
    this.spaceMode = new SpaceMode(planets, enemies, size, player);
    this.planetMode = new PlanetMode();
    this.currentMode = this.spaceMode; // Start in space mode

    this.transitionManager = new ModeTransitionManager();
  }

  update(
    actions: Set<string>,
    _updatePlayer: (dt: number, actions: Set<string>, visitedPlanet?: boolean) => void,
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
    dt: number,
  ) {
    // Handle mode transitions first
    this.handleModeTransitions();

    // Update current mode
    this.currentMode.update(dt, actions, this.player, this);

    // Handle procedural generation for space mode
    if (this.currentMode.type === "space") {
      this.handleSpaceGeneration(maybeGenerateRegion);
    }
  }

  // Public API for modes to request transitions
  requestModeTransition(targetMode: GameModeType, data?: unknown): void {
    this.transitionManager.requestTransition(targetMode, data);
  }

  // Getters for backward compatibility and mode access
  get planets(): Planet[] {
    return this.spaceMode.planetsData;
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.spaceMode.updatePlanets(newPlanets);
  }

  get projectiles() {
    return this.currentMode.type === "space" ? this.spaceMode.projectilesData : [];
  }

  get enemies() {
    return this.currentMode.type === "space" ? this.spaceMode.enemiesData : [];
  }

  getCurrentMode(): GameMode {
    return this.currentMode;
  }

  getCurrentModeType(): GameModeType {
    return this.currentMode.type;
  }

  private handleModeTransitions(): void {
    if (!this.transitionManager.hasPendingTransition()) {
      return;
    }

    const transition = this.transitionManager.consumePendingTransition();
    if (!transition) return;

    // Save current mode state
    this.transitionManager.saveState(this.currentMode.type, this.currentMode.saveState());

    if (transition.targetMode === "planet" && this.currentMode.type === "space") {
      // Landing transition
      const data = transition.data as { planetId: string } | undefined;
      const planet = this.spaceMode.planetsData.find((p) => p.id === data?.planetId);
      if (planet) {
        this.planetMode.landOnPlanet(planet, this.player);
        this.currentMode = this.planetMode;
      }
    } else if (transition.targetMode === "space" && this.currentMode.type === "planet") {
      // Takeoff transition
      const data = transition.data as { returnPosition: { x: number; y: number } } | undefined;
      if (data?.returnPosition) {
        this.player.state.x = data.returnPosition.x;
        this.player.state.y = data.returnPosition.y;
        this.player.state.vx = 0;
        this.player.state.vy = 0;
      }
      this.currentMode = this.spaceMode;
    }
  }

  private handleSpaceGeneration(
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
  ): void {
    const gridStep = Math.max(this.size.width, this.size.height) / 3;
    const REGION_SIZE = gridStep;
    const regionX = Math.floor(this.player.state.x / REGION_SIZE);
    const regionY = Math.floor(this.player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: this.player.state.x, y: this.player.state.y }, regionKey);
  }
}
