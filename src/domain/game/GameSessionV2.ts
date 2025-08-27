import type { Player } from "./player";
import type { Planet } from "./planets";
import type { Enemy } from "./enemies";
import type { GameModeType } from "./modes/GameMode";
import type { SpaceToPlanetTransition, PlanetToSpaceTransition } from "../../shared/types/Game";
import { GameManager, type GameManagerConfig } from "../../application/GameManager";
import type { Camera } from "../render/camera";
import type { ViewSize, Point2D } from "../../shared/types/geometry";
import type { Action } from "../../engine/input/ActionTypes";

export class GameSessionV2 {
  private gameManager: GameManager;

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
    actions: Set<Action>,
    _updatePlayer: (dt: number, actions: Set<Action>, visitedPlanet?: boolean) => void,
    maybeGenerateRegion: (center: Point2D, regionKey: string) => void,
    dt: number,
  ): void {
    // Update game manager with external actions
    this.gameManager.update(dt, actions);

    // Handle procedural generation for space mode
    if (this.getCurrentModeType() === "space") {
      this.handleSpaceGeneration(maybeGenerateRegion);
    }
  }

  // Forward all API calls to GameManager
  getCamera(): Camera {
    return this.gameManager.camera;
  }

  getPlayer(): Player {
    return this.gameManager.getPlayer();
  }

  getSize(): ViewSize {
    return this.gameManager.getSize();
  }

  getNotification(): string | null {
    return this.gameManager.notification;
  }

  setNotification(value: string | null): void {
    this.gameManager.notification = value;
  }

  getPlanets(): Planet[] {
    return this.gameManager.getPlanets();
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.gameManager.updatePlanets(newPlanets);
  }

  getProjectiles(): { x: number; y: number; radius: number }[] {
    return this.gameManager.getProjectiles();
  }

  getEnemies(): Enemy[] {
    return this.gameManager.getEnemies();
  }

  getCurrentModeType(): GameModeType {
    return this.gameManager.getCurrentModeType();
  }

  // This method was used by modes to request transitions
  // Now it's handled internally by the GameManager
  requestModeTransition(
    targetMode: GameModeType,
    data?: SpaceToPlanetTransition | PlanetToSpaceTransition,
  ): void {
    this.gameManager.switchToGame(targetMode, data);
  }

  private handleSpaceGeneration(
    maybeGenerateRegion: (center: Point2D, regionKey: string) => void,
  ): void {
    const size = this.gameManager.getSize();
    const player = this.gameManager.getPlayer();

    const gridStep = Math.max(size.width, size.height) / 3;
    const REGION_SIZE = gridStep;
    const regionX = Math.floor(player.state.x / REGION_SIZE);
    const regionY = Math.floor(player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: player.state.x, y: player.state.y }, regionKey);
  }
}
