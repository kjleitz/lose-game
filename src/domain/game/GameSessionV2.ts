import type { Player } from "./player";
import type { Planet } from "./planets";
import type { Enemy } from "./enemies";
import type { GameModeType } from "./modes/GameMode";
import { GameManager, type GameManagerConfig } from "../../application/GameManager";

export class GameSessionV2 {
  private gameManager: GameManager;
  
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
    const config: GameManagerConfig = {
      player,
      planets,
      enemies,
      size,
    };
    
    this.gameManager = new GameManager(config);
    
    // Set initial camera from constructor
    this.gameManager.camera = camera;
  }

  update(
    actions: Set<string>,
    _updatePlayer: (dt: number, actions: Set<string>, visitedPlanet?: boolean) => void,
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
    dt: number,
  ) {
    // Update actions in the engine
    // Note: In a full implementation, we'd integrate this with the engine's input system
    
    // Update game manager
    this.gameManager.update(dt);

    // Handle procedural generation for space mode
    if (this.getCurrentModeType() === "space") {
      this.handleSpaceGeneration(maybeGenerateRegion);
    }
  }

  // Forward all API calls to GameManager
  get camera(): { x: number; y: number; zoom: number } {
    return this.gameManager.camera;
  }

  get player(): Player {
    // The GameManager doesn't expose player directly, but we need it for compatibility
    // This is a temporary solution during the transition
    throw new Error("Player access needs to be refactored");
  }

  get size(): { width: number; height: number } {
    // Size should be available from GameManager config
    throw new Error("Size access needs to be refactored");
  }

  get notification(): string | null {
    return this.gameManager.notification;
  }

  set notification(value: string | null) {
    this.gameManager.notification = value;
  }

  get planets(): Planet[] {
    return this.gameManager.planets;
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.gameManager.updatePlanets(newPlanets);
  }

  get projectiles() {
    return this.gameManager.projectiles;
  }

  get enemies() {
    return this.gameManager.enemies;
  }

  getCurrentModeType(): GameModeType {
    return this.gameManager.getCurrentModeType();
  }

  // This method was used by modes to request transitions
  // Now it's handled internally by the GameManager
  requestModeTransition(targetMode: GameModeType, data?: unknown): void {
    this.gameManager.switchToGame(targetMode, data);
  }

  private handleSpaceGeneration(
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
  ): void {
    const size = { width: 800, height: 600 }; // TODO: Get from GameManager
    const player = { x: this.camera.x, y: this.camera.y }; // TODO: Get actual player state
    
    const gridStep = Math.max(size.width, size.height) / 3;
    const REGION_SIZE = gridStep;
    const regionX = Math.floor(player.x / REGION_SIZE);
    const regionY = Math.floor(player.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: player.x, y: player.y }, regionKey);
  }
}