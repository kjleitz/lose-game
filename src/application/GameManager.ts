import type { Game, TransitionData } from "../shared/types/Game";
import { createGameEngine, type GameEngineConfig, GameEngine } from "../engine/core";
import { SpaceGame, type SpaceGameConfig } from "../games/space/SpaceGame";
import { PlanetGame } from "../games/planet/PlanetGame";
import type { Player } from "../domain/game/player";
import type { Planet } from "../domain/game/planets";
import type { Enemy } from "../domain/game/enemies";
import type { Action, ActionState } from "../engine/input/ActionTypes";

export interface GameManagerConfig {
  canvas?: HTMLCanvasElement;
  player: Player;
  planets: Planet[];
  enemies?: Enemy[];
  size: { width: number; height: number };
}

export class GameManager {
  private currentGame: Game | null = null;
  private games: Map<string, Game> = new Map();
  private engine: GameEngine;
  private _player: Player;
  private _size: { width: number; height: number };

  // For backward compatibility during transition
  public camera: { x: number; y: number; zoom: number };
  public notification: string | null = null;

  constructor(config: GameManagerConfig) {
    this._player = config.player;
    this._size = config.size;
    this.camera = { x: 0, y: 0, zoom: 1 };

    // Create engine
    const engineConfig: GameEngineConfig = {
      canvas: config.canvas,
    };
    this.engine = createGameEngine(engineConfig);

    // Create and register games
    const spaceGameConfig: SpaceGameConfig = {
      planets: config.planets,
      enemies: config.enemies,
      size: config.size,
      player: config.player,
    };
    const spaceGame = new SpaceGame(spaceGameConfig);
    const planetGame = new PlanetGame();

    // Set up transition callbacks
    spaceGame.setModeTransitionCallback((targetMode, data) => {
      this.switchToGame(targetMode, data as TransitionData);
    });
    planetGame.setModeTransitionCallback((targetMode, data) => {
      this.switchToGame(targetMode, data as TransitionData);
    });
    planetGame.setPlayer(config.player);

    this.registerGame(spaceGame);
    this.registerGame(planetGame);

    // Start with space game
    this.switchToGame("space");
  }

  private registerGame(game: Game): void {
    this.games.set(game.name, game);
  }

  switchToGame(gameName: string, transitionData?: TransitionData): void {
    const targetGame = this.games.get(gameName);
    if (!targetGame) throw new Error(`Game ${gameName} not found`);

    // Handle transition
    if (this.currentGame) {
      if (!this.currentGame.canTransitionTo(gameName)) {
        throw new Error(`Cannot transition from ${this.currentGame.name} to ${gameName}`);
      }
      this.currentGame.cleanup();
    }

    this.currentGame = targetGame;
    this.currentGame.initialize(this.engine);

    if (transitionData) {
      // Handle specific transitions
      if (gameName === "planet" && transitionData.planetId) {
        const spaceGame = this.games.get("space") as SpaceGame;
        const planet = spaceGame.planetsData.find((p) => p.id === transitionData.planetId);
        if (planet) {
          this.currentGame.receiveTransition({ ...transitionData, planet });
        }
      } else {
        this.currentGame.receiveTransition(transitionData);
      }
    }

    // Update notifications based on current game
    this.updateNotifications();
  }

  update(dt: number, externalActions?: Set<string>): void {
    // Sync input actions from external system during transition
    if (externalActions) {
      const actionState = this.convertToActionState(externalActions);
      this.engine.updateInputActions(actionState);
    }

    this.currentGame?.update(dt);
    this.updateCamera();
    this.updateNotifications();
  }

  render(): void {
    this.currentGame?.render();
  }

  // Backward compatibility methods
  getCurrentModeType(): "space" | "planet" {
    return (this.currentGame?.name as "space" | "planet") || "space";
  }

  get planets(): Planet[] {
    const spaceGame = this.games.get("space") as SpaceGame;
    return spaceGame?.planetsData || [];
  }

  updatePlanets(newPlanets: Planet[]): void {
    const spaceGame = this.games.get("space") as SpaceGame;
    spaceGame?.updatePlanets(newPlanets);
  }

  get projectiles() {
    if (this.currentGame?.name === "space") {
      const spaceGame = this.currentGame as SpaceGame;
      return spaceGame.projectilesData;
    }
    return [];
  }

  get enemies() {
    if (this.currentGame?.name === "space") {
      const spaceGame = this.currentGame as SpaceGame;
      return spaceGame.enemiesData;
    }
    return [];
  }

  // For planet mode compatibility
  get currentPlanet() {
    if (this.currentGame?.name === "planet") {
      const planetGame = this.currentGame as PlanetGame;
      return planetGame.planetData;
    }
    return undefined;
  }

  get planetSurface() {
    if (this.currentGame?.name === "planet") {
      const planetGame = this.currentGame as PlanetGame;
      return planetGame.surfaceData;
    }
    return undefined;
  }

  // Getters for backward compatibility
  get player(): Player {
    return this._player;
  }

  get size(): { width: number; height: number } {
    return this._size;
  }

  private updateCamera(): void {
    // Set camera to follow player
    this.camera.x = this._player.state.x;
    this.camera.y = this._player.state.y;
  }

  private updateNotifications(): void {
    if (this.currentGame?.name === "space") {
      // Check proximity to planets
      let nearPlanet: Planet | null = null;
      for (const planet of this.planets) {
        const dist = Math.hypot(this._player.state.x - planet.x, this._player.state.y - planet.y);
        if (dist < planet.radius + 60) {
          nearPlanet = planet;
          break;
        }
      }

      if (nearPlanet) {
        this.notification = `Press L to land on ${nearPlanet.id}`;
      } else {
        this.notification = null;
      }
    } else if (this.currentGame?.name === "planet" && this.currentPlanet) {
      this.notification = `Exploring ${this.currentPlanet.id} - Press T to takeoff`;
    }
  }

  private isValidAction(action: string): action is Action {
    return (
      action === "thrust" ||
      action === "turnLeft" ||
      action === "turnRight" ||
      action === "fire" ||
      action === "interact" ||
      action === "boost" ||
      action === "speedUp" ||
      action === "speedDown" ||
      action === "land" ||
      action === "takeoff" ||
      action === "inventory"
    );
  }

  private convertToActionState(actions: Set<string>): ActionState {
    const actionState = new Set<Action>();

    for (const action of actions) {
      if (this.isValidAction(action)) {
        actionState.add(action);
      }
    }

    return actionState;
  }
}
