import type { Enemy } from "../domain/game/enemies";
import type { Planet } from "../domain/game/planets";
import type { Player } from "../domain/game/player";
import type { Camera } from "../domain/render/camera";
import { createGameEngine, GameEngine, type GameEngineConfig } from "../engine/core";
import type { Action, ActionState } from "../engine/input/ActionTypes";
import { PlanetGame } from "../games/planet/PlanetGame";
import { SpaceGame, type SpaceGameConfig } from "../games/space/SpaceGame";
import type {
  Game,
  TransitionData,
  SpaceToPlanetTransition,
  PlanetLandingTransition,
} from "../shared/types/Game";
import type { ViewSize } from "../shared/types/geometry";
import type { PlanetSurface } from "../games/planet/PlanetGame";

export interface GameManagerConfig {
  canvas?: HTMLCanvasElement;
  player: Player;
  planets: Planet[];
  enemies?: Enemy[];
  size: ViewSize;
}

export class GameManager {
  private currentGame: Game | null = null;
  private games: Map<string, Game> = new Map();
  private engine: GameEngine;
  private _player: Player;
  private _size: ViewSize;

  // For backward compatibility during transition
  public camera: Camera;
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
      this.switchToGame(targetMode, data);
    });
    planetGame.setModeTransitionCallback((targetMode, data) => {
      this.switchToGame(targetMode, data);
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

  switchToGame(gameName: "space" | "planet", transitionData?: TransitionData): void {
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
      if (gameName === "planet" && isSpaceToPlanet(transitionData)) {
        const space = this.games.get("space");
        if (space instanceof SpaceGame) {
          const planet = space.getPlanetsData().find((p) => p.id === transitionData.planetId);
          if (planet) {
            const data: PlanetLandingTransition = { planet };
            this.currentGame.receiveTransition(data);
          }
        }
      } else {
        this.currentGame.receiveTransition(transitionData);
      }
    }

    // Update notifications based on current game
    this.updateNotifications();
  }

  update(dt: number, externalActions?: Set<Action>): void {
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
    const n = this.currentGame?.name;
    return n === "planet" ? "planet" : "space";
  }

  getPlanets(): Planet[] {
    const space = this.games.get("space");
    return space instanceof SpaceGame ? space.getPlanetsData() : [];
  }

  updatePlanets(newPlanets: Planet[]): void {
    const space = this.games.get("space");
    if (space instanceof SpaceGame) space.updatePlanets(newPlanets);
  }

  getProjectiles(): { x: number; y: number; radius: number }[] {
    const g = this.currentGame;
    return g instanceof SpaceGame ? g.getProjectilesData() : [];
  }

  getEnemies(): Enemy[] {
    const g = this.currentGame;
    return g instanceof SpaceGame ? g.getEnemiesData() : [];
  }

  // For planet mode compatibility
  getCurrentPlanet(): Planet | undefined {
    const g = this.currentGame;
    return g instanceof PlanetGame ? g.getPlanetData() : undefined;
  }

  getPlanetSurface(): PlanetSurface | undefined {
    const g = this.currentGame;
    return g instanceof PlanetGame ? g.getSurfaceData() : undefined;
  }

  // Getters for backward compatibility
  getPlayer(): Player {
    return this._player;
  }

  getSize(): ViewSize {
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
      for (const planet of this.getPlanets()) {
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
    } else if (this.currentGame?.name === "planet" && this.getCurrentPlanet()) {
      this.notification = `Exploring ${this.getCurrentPlanet()!.id} - Press T to takeoff`;
    }
  }

  private convertToActionState(actions: Set<Action>): ActionState {
    return new Set<Action>(actions);
  }
}

function isSpaceToPlanet(x: TransitionData): x is SpaceToPlanetTransition {
  return "planetId" in x;
}
