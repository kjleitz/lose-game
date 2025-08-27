import type { Node } from "../../domain/ai/bt";
import type { EnemyBlackboard } from "../../domain/ai/enemy/EnemyBlackboard";
import { buildPatrolSeekTree } from "../../domain/ai/enemy/trees";
import type { Enemy } from "../../domain/game/enemies";
import { createEnemy } from "../../domain/game/enemies";
import type { GameModeType } from "../../domain/game/modes/GameMode";
import type { Planet } from "../../domain/game/planets";
import type { Player } from "../../domain/game/player";
import type { Projectile } from "../../domain/game/projectiles";
import { createProjectile, stepProjectile } from "../../domain/game/projectiles";
import type { Game, GameEngine, GameState, TransitionData } from "../../shared/types/Game";
import type { Point2D, ViewSize } from "../../shared/types/geometry";

// import type { Action } from "../../engine/input/ActionTypes";
// import { setCameraPosition } from "../../domain/render/camera"; // TODO: Remove when camera system is extracted

export interface SpaceGameState {
  playerPosition: Point2D;
  visitedPlanets: Set<string>;
  enemies: Enemy[];
  projectiles: Projectile[];
}

export interface SpaceGameConfig {
  planets: Planet[];
  enemies?: Enemy[];
  size: ViewSize;
  player: Player;
}

export class SpaceGame implements Game {
  readonly name = "space";
  readonly version = "1.0.0";

  private planets: Planet[] = [];
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private fireCooldown = 0;
  private readonly FIRE_RATE = 8;
  private aiTree: Node<EnemyBlackboard>;
  private enemyBlackboards: Map<string, EnemyBlackboard> = new Map();

  private readonly size: ViewSize;
  private player: Player;
  private engine?: GameEngine;

  // Callback for requesting mode transitions (will be set by GameManager)
  private onModeTransition?: (targetMode: GameModeType, data?: TransitionData) => void;

  constructor(config: SpaceGameConfig) {
    this.size = config.size;
    this.planets = config.planets;
    this.player = config.player;
    this.enemies =
      config.enemies && config.enemies.length > 0
        ? config.enemies
        : [createEnemy("e-1", 300, 0), createEnemy("e-2", 0, -400, 16, 30)];

    this.aiTree = buildPatrolSeekTree();
    this.initializeEnemyBlackboards();
  }

  initialize(engine: GameEngine): void {
    this.engine = engine;
  }

  update(dt: number): void {
    if (!this.engine) return;

    const actions = this.engine.input.actions;

    // Handle firing
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (actions.has("fire") && this.fireCooldown <= 0) {
      this.projectiles.push(
        createProjectile({
          x: this.player.state.x,
          y: this.player.state.y,
          angle: this.player.state.angle,
        }),
      );
      this.fireCooldown = 1 / this.FIRE_RATE;
    }

    // Check proximity to planets and handle landing
    let nearPlanet: Planet | null = null;
    for (const planet of this.planets) {
      const dist = Math.hypot(this.player.state.x - planet.x, this.player.state.y - planet.y);
      if (dist < planet.radius + 60) {
        nearPlanet = planet;
        break;
      }
    }

    // Handle landing action
    if (actions.has("land") && nearPlanet) {
      this.onModeTransition?.("planet", { planetId: nearPlanet.id });
      return;
    }

    // Update player with space physics
    this.player.updateSpace(dt, actions);

    // Update projectiles
    this.updateProjectiles(dt);

    // Update enemy AI
    this.updateEnemyAI(dt);
  }

  render(): void {
    // Rendering will be handled by the GameRenderer for now
    // In future iterations, this would manage space-specific rendering
  }

  cleanup(): void {
    // Cleanup resources if needed
  }

  saveState(): SpaceGameState {
    return {
      playerPosition: { x: this.player.state.x, y: this.player.state.y },
      visitedPlanets: new Set(),
      enemies: [...this.enemies],
      projectiles: [...this.projectiles],
    };
  }

  loadState(state: GameState): void {
    if (this.isSpaceState(state)) {
      this.enemies = state.enemies;
      this.projectiles = state.projectiles;
    }
  }

  canTransitionTo(targetGame: GameModeType): boolean {
    return targetGame === "planet";
  }

  prepareTransition(_targetGame: GameModeType): TransitionData | null {
    return null;
  }

  receiveTransition(data: TransitionData): void {
    // Handle return from planet mode
    if ("returnPosition" in data) {
      const position = data.returnPosition;
      this.player.state.x = position.x;
      this.player.state.y = position.y;
      this.player.state.vx = 0;
      this.player.state.vy = 0;
    }
  }

  // Public API for backward compatibility
  getPlanetsData(): Planet[] {
    return this.planets;
  }

  getProjectilesData(): Projectile[] {
    return this.projectiles;
  }

  getEnemiesData(): Enemy[] {
    return this.enemies;
  }

  setPlanets(planets: Planet[]): void {
    this.planets = planets;
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.planets = [...newPlanets];
  }

  getWorldSize(): ViewSize {
    return this.size;
  }

  setModeTransitionCallback(
    callback: (targetMode: GameModeType, data?: TransitionData) => void,
  ): void {
    this.onModeTransition = callback;
  }

  private updateProjectiles(dt: number): void {
    const next: Projectile[] = [];

    for (const p of this.projectiles) {
      stepProjectile(p, dt);
      if (p.ttl <= 0) continue;

      // Check enemy collisions
      let consumed = false;
      for (const enemy of this.enemies) {
        const distE = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (distE <= enemy.radius) {
          enemy.health -= 10;
          consumed = true;
          if (enemy.health <= 0) {
            this.enemies = this.enemies.filter((e) => e !== enemy);
            this.enemyBlackboards.delete(enemy.id);
            this.player.state.experience = (this.player.state.experience ?? 0) + 5;
          }
          break;
        }
      }
      if (consumed) continue;

      // Check planet collisions
      let hitPlanet = false;
      for (const planet of this.planets) {
        const dist = Math.hypot(p.x - planet.x, p.y - planet.y);
        if (dist <= planet.radius) {
          hitPlanet = true;
          break;
        }
      }
      if (!hitPlanet) next.push(p);
    }

    this.projectiles = next;
  }

  private updateEnemyAI(dt: number): void {
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;

      const bb = this.enemyBlackboards.get(enemy.id);
      if (!bb) continue;

      bb.enemy = enemy;
      bb.player = this.player;
      bb.planets = this.planets;
      const currentTime = bb.time == null ? 0 : bb.time;
      bb.time = currentTime + dt;

      this.aiTree.tick(bb, dt);
    }
  }

  private initializeEnemyBlackboards(): void {
    for (const enemy of this.enemies) {
      this.enemyBlackboards.set(enemy.id, {
        enemy,
        player: this.player,
        planets: this.planets,
        rng: Math.random,
        time: 0,
        scratch: {
          playerDetected: false,
          waypoint: null,
          waypointReached: false,
          spawnX: enemy.x,
          spawnY: enemy.y,
        },
      });
    }
  }

  private isSpaceState(state: GameState): state is SpaceGameState {
    return "enemies" in state && "projectiles" in state;
  }
}
