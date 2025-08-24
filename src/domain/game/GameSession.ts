import { setCameraPosition } from "../render/camera";
import type { Player } from "./player";
import type { Planet } from "./planets";
import type { Projectile } from "./projectiles";
import { createProjectile, stepProjectile } from "./projectiles";
import type { Enemy } from "./enemies";
import { createEnemy } from "./enemies";
import type { Blackboard, Node } from "../ai/bt";
import { buildPatrolSeekTree } from "../ai/enemy/trees";

export class GameSession {
  camera: { x: number; y: number; zoom: number };
  player: Player;
  planets: Planet[];
  size: { width: number; height: number };
  notification: string | null = null;
  projectiles: Projectile[] = [];
  enemies: Enemy[] = [];
  private fireCooldown = 0; // seconds
  private readonly FIRE_RATE = 8; // shots per second
  private aiTree: Node;
  private enemyBlackboards: Map<string, Blackboard> = new Map();

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
    this.planets = planets;
    this.size = size;
    this.enemies = enemies ?? [
      // seed a couple basic enemies near origin
      createEnemy("e-1", 300, 0),
      createEnemy("e-2", 0, -400, 16, 30),
    ];

    // Initialize AI system
    this.aiTree = buildPatrolSeekTree();
    this.initializeEnemyBlackboards();
  }

  update(
    actions: Set<string>,
    updatePlayer: (dt: number, actions: Set<string>, visitedPlanet?: boolean) => void,
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
    dt: number,
  ) {
    // Handle firing (simple cooldown + straight projectile)
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
    // Check proximity to planets
    let foundPlanet: Planet | null = null;
    for (const planet of this.planets) {
      const dist = Math.hypot(this.player.state.x - planet.x, this.player.state.y - planet.y);
      if (dist < planet.radius + 60) {
        foundPlanet = planet;
        break;
      }
    }
    // Pass visitedPlanet to updatePlayer
    updatePlayer(dt, actions, !!foundPlanet);
    setCameraPosition(this.camera, this.player.state.x, this.player.state.y);
    // Procedural planet generation by region (grid-based)
    const gridStep = Math.max(this.size.width, this.size.height) / 3;
    const REGION_SIZE = gridStep; // generate once per grid cell crossed
    const regionX = Math.floor(this.player.state.x / REGION_SIZE);
    const regionY = Math.floor(this.player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    // Center generation around the player's current position so new cells appear ahead
    maybeGenerateRegion({ x: this.player.state.x, y: this.player.state.y }, regionKey);
    // Step projectiles and cull on TTL or collisions
    const next: Projectile[] = [];
    for (const p of this.projectiles) {
      stepProjectile(p, dt);
      if (p.ttl <= 0) continue;
      // collision with enemies first
      let consumed = false;
      for (const enemy of this.enemies) {
        const distE = Math.hypot(p.x - enemy.x, p.y - enemy.y);
        if (distE <= enemy.radius) {
          enemy.health -= 10; // basic damage per hit
          consumed = true;
          if (enemy.health <= 0) {
            this.enemies = this.enemies.filter((e) => e !== enemy);
            this.enemyBlackboards.delete(enemy.id); // Clean up blackboard
            this.player.state.experience = (this.player.state.experience ?? 0) + 5;
            this.notification = `Enemy destroyed! (+5 XP)`;
          }
          break;
        }
      }
      if (consumed) continue;

      // simple collision with planets
      let hit = false;
      for (const planet of this.planets) {
        const dist = Math.hypot(p.x - planet.x, p.y - planet.y);
        if (dist <= planet.radius) {
          hit = true;
          break;
        }
      }
      if (!hit) next.push(p);
    }
    this.projectiles = next;

    // Update enemy AI
    this.updateEnemyAI(dt);

    if (foundPlanet) {
      this.notification = `Arrived at planet! (${foundPlanet.id})`;
    } else {
      this.notification = null;
    }
  }

  private initializeEnemyBlackboards() {
    for (const enemy of this.enemies) {
      this.enemyBlackboards.set(enemy.id, {
        enemy,
        player: this.player,
        planets: this.planets,
        rng: Math.random,
        time: 0,
        config: {},
        scratch: {},
      });
    }
  }

  private updateEnemyAI(dt: number) {
    for (const enemy of this.enemies) {
      if (enemy.health <= 0) continue;

      const bb = this.enemyBlackboards.get(enemy.id);
      if (!bb) continue;

      // Update blackboard with current state
      bb.enemy = enemy;
      bb.player = this.player;
      bb.planets = this.planets;
      bb.time = (bb.time as number) + dt;

      // Tick the behavior tree
      this.aiTree.tick(bb, dt);
    }
  }
}
