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
    // Update game manager with external actions
    this.gameManager.update(dt, actions);

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
    return this.gameManager.player;
  }

  get size(): { width: number; height: number } {
    return this.gameManager.size;
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
    this.gameManager.switchToGame(targetMode, data as { [key: string]: unknown });
  }

  private handleSpaceGeneration(
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
  ): void {
    const size = this.gameManager.size;
    const player = this.gameManager.player;
    
    const gridStep = Math.max(size.width, size.height) / 3;
    const REGION_SIZE = gridStep;
    const regionX = Math.floor(player.state.x / REGION_SIZE);
    const regionY = Math.floor(player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: player.state.x, y: player.state.y }, regionKey);
  }
}