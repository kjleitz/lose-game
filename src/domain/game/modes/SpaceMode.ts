import { GameMode, type GameModeState, type SpaceModeState, type GameModeType } from "./GameMode";
import type { Player } from "../player";
import type { GameSession } from "../GameSession";
import type { Planet } from "../planets";
import type { Enemy } from "../enemies";
import type { Projectile } from "../projectiles";
import { createProjectile, stepProjectile } from "../projectiles";
import { createEnemy } from "../enemies";
import type { Blackboard, Node } from "../../ai/bt";
import { buildPatrolSeekTree } from "../../ai/enemy/trees";
import { setCameraPosition } from "../../render/camera";

export class SpaceMode extends GameMode {
  readonly type = "space" as const;

  private planets: Planet[] = [];
  private projectiles: Projectile[] = [];
  private enemies: Enemy[] = [];
  private fireCooldown = 0;
  private readonly FIRE_RATE = 8;
  private aiTree: Node;
  private enemyBlackboards: Map<string, Blackboard> = new Map();

  private readonly size: { width: number; height: number };

  constructor(
    planets: Planet[] = [],
    enemies: Enemy[] = [],
    size: { width: number; height: number },
    player: Player,
  ) {
    super();
    this.size = size;
    this.planets = planets;
    this.enemies =
      enemies.length > 0
        ? enemies
        : [createEnemy("e-1", 300, 0), createEnemy("e-2", 0, -400, 16, 30)];

    this.aiTree = buildPatrolSeekTree();
    this.initializeEnemyBlackboards(player);
  }

  update(dt: number, actions: Set<string>, player: Player, session: GameSession): void {
    // Handle firing
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    if (actions.has("fire") && this.fireCooldown <= 0) {
      this.projectiles.push(
        createProjectile({
          x: player.state.x,
          y: player.state.y,
          angle: player.state.angle,
        }),
      );
      this.fireCooldown = 1 / this.FIRE_RATE;
    }

    // Check proximity to planets and handle landing
    let nearPlanet: Planet | null = null;
    for (const planet of this.planets) {
      const dist = Math.hypot(player.state.x - planet.x, player.state.y - planet.y);
      if (dist < planet.radius + 60) {
        nearPlanet = planet;
        break;
      }
    }

    // Handle landing action
    if (actions.has("land") && nearPlanet) {
      session.requestModeTransition("planet", { planetId: nearPlanet.id });
      return;
    }

    // Update player with space physics
    player.updateSpace(dt, actions);

    // Set camera to follow player
    setCameraPosition(session.camera, player.state.x, player.state.y);

    // Update projectiles
    this.updateProjectiles(dt, player);

    // Update enemy AI
    this.updateEnemyAI(dt, player);

    // Set notification based on proximity
    if (nearPlanet) {
      session.notification = `Press L to land on ${nearPlanet.id}`;
    } else {
      session.notification = null;
    }
  }

  canTransitionTo(mode: GameModeType): boolean {
    return mode === "planet";
  }

  saveState(): SpaceModeState {
    return {
      type: "space",
      playerPosition: { x: 0, y: 0 }, // Will be set by GameSession
      visitedPlanets: new Set(),
    };
  }

  loadState(state: GameModeState): void {
    if (state.type !== "space") {
      throw new Error(`Cannot load ${state.type} state into SpaceMode`);
    }
    // Restore space-specific state
  }

  getRequiredHudComponents(): string[] {
    return ["HealthBar", "ExperienceBar", "Radar", "ActionReadout"];
  }

  // Public getters for GameSession integration
  get planetsData(): Planet[] {
    return this.planets;
  }

  get projectilesData(): Projectile[] {
    return this.projectiles;
  }

  get enemiesData(): Enemy[] {
    return this.enemies;
  }

  setPlanets(planets: Planet[]): void {
    this.planets = planets;
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.planets = [...newPlanets];
  }

  getWorldSize(): { width: number; height: number } {
    return this.size;
  }

  private updateProjectiles(dt: number, player: Player): void {
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
            player.state.experience = (player.state.experience ?? 0) + 5;
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

  private updateEnemyAI(dt: number, player: Player): void {
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;

      const bb = this.enemyBlackboards.get(enemy.id);
      if (!bb) continue;

      bb.enemy = enemy;
      bb.player = player;
      bb.planets = this.planets;
      const currentTime = bb.time as number;
      bb.time = currentTime + dt;

      this.aiTree.tick(bb, dt);
    }
  }

  private initializeEnemyBlackboards(player: Player): void {
    for (const enemy of this.enemies) {
      this.enemyBlackboards.set(enemy.id, {
        enemy,
        player,
        planets: this.planets,
        rng: Math.random,
        time: 0,
        config: {},
        scratch: {},
      });
    }
  }
}
