import type { Player } from "./player";
import type { Planet } from "./planets";
import type { Enemy } from "./enemies";
import type { GameModeType } from "./modes/GameMode";
import { GameMode } from "./modes/GameMode";
import { SpaceMode } from "./modes/SpaceMode";
import { PlanetMode } from "./modes/PlanetMode";
import { ModeTransitionManager } from "./modes/ModeTransition";
import type { Camera } from "../render/camera";
import type { ViewSize, Point2D } from "../../shared/types/geometry";
import type { Action } from "../../engine/input/ActionTypes";

export class GameSession {
  camera: Camera;
  player: Player;
  size: ViewSize;
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
    camera: Camera;
    player: Player;
    planets: Planet[];
    size: ViewSize;
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
    actions: Set<Action>,
    _updatePlayer: (dt: number, actions: Set<Action>, visitedPlanet?: boolean) => void,
    maybeGenerateRegion: (center: Point2D, regionKey: string) => void,
    dt: number,
  ): void {
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
  requestModeTransition(
    targetMode: GameModeType,
    data?: { planetId?: string; returnPosition?: Point2D },
  ): void {
    this.transitionManager.requestTransition(targetMode, data);
  }

  // Getters for backward compatibility and mode access
  getPlanets(): Planet[] {
    return this.spaceMode.getPlanetsData();
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.spaceMode.updatePlanets(newPlanets);
  }

  getProjectiles(): { x: number; y: number; radius: number }[] {
    return this.currentMode.type === "space" ? this.spaceMode.getProjectilesData() : [];
  }

  getEnemies(): Enemy[] {
    return this.currentMode.type === "space" ? this.spaceMode.getEnemiesData() : [];
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
      const planetId = transition.data?.planetId;
      const planet = this.spaceMode.getPlanetsData().find((p) => p.id === planetId);
      if (planet) {
        this.planetMode.landOnPlanet(planet, this.player);
        this.currentMode = this.planetMode;
      }
    } else if (transition.targetMode === "space" && this.currentMode.type === "planet") {
      // Takeoff transition
      const pos = transition.data?.returnPosition;
      if (pos) {
        this.player.state.x = pos.x;
        this.player.state.y = pos.y;
        this.player.state.vx = 0;
        this.player.state.vy = 0;
      }
      this.currentMode = this.spaceMode;
    }
  }

  private handleSpaceGeneration(
    maybeGenerateRegion: (center: Point2D, regionKey: string) => void,
  ): void {
    const gridStep = Math.max(this.size.width, this.size.height) / 3;
    const REGION_SIZE = gridStep;
    const regionX = Math.floor(this.player.state.x / REGION_SIZE);
    const regionY = Math.floor(this.player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: this.player.state.x, y: this.player.state.y }, regionKey);
  }
}
