import type { Action } from "../../engine";
import { type EntityBuilder, World } from "../../lib/ecs";
import type { Circle2D, ViewSize } from "../../shared/types/geometry";
import type { Enemy } from "../game/enemies";
import type { Planet } from "../game/planets";
import type { Player } from "../game/player";
import type { EntityCounts, PlayerView } from "../game/views";
import type { Camera } from "../render/camera";
import * as Components from "./components";
import * as EntityFactories from "./entities/EntityFactories";
import { createCollisionSystem } from "./systems/CollisionSystem";
import { createEnemyAISystem } from "./systems/EnemyAISystem";
import { createMovementSystem } from "./systems/MovementSystem";
import { createPlayerControlSystem } from "./systems/PlayerControlSystem";
import { createProjectileSystem } from "./systems/ProjectileSystem";
import { createWeaponSystem } from "./systems/WeaponSystem";

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;
  private mode: "space" | "planet" = "space";
  private returnPosition: { x: number; y: number } | null = null;
  private landedPlanetId: string | null = null;

  // Camera (keep as is for now)
  camera: Camera;
  size: ViewSize;
  notification: string | null = null;

  constructor(config?: {
    camera?: Camera;
    player?: Player;
    planets?: Planet[];
    size?: ViewSize;
    enemies?: Enemy[];
  }) {
    this.camera = config?.camera || { x: 0, y: 0, zoom: 1 };
    this.size = config?.size || { width: 800, height: 600 };

    if (config) {
      this.createInitialEntities(config);
    } else {
      this.createDefaultGame();
    }
  }

  private createDefaultGame(): void {
    // Create a basic game setup for testing
    const playerEntity = EntityFactories.createBasicPlayer(this.world, 0, 0);
    this.playerEntityId = this.getEntityId(playerEntity);

    // Create some enemies
    EntityFactories.createBasicEnemy(this.world, "enemy_1", 200, 100);
    EntityFactories.createBasicEnemy(this.world, "enemy_2", -150, 200);
    EntityFactories.createBasicEnemy(this.world, "enemy_3", 100, -150);

    // Create some planets
    EntityFactories.createBasicPlanet(this.world, "planet_1", 400, 300, 80);
    EntityFactories.createBasicPlanet(this.world, "planet_2", -300, -200, 60);
    EntityFactories.createBasicPlanet(this.world, "planet_3", -100, 400, 70);
    EntityFactories.createBasicPlanet(this.world, "planet_4", 500, -300, 90);
  }

  private createInitialEntities(config: {
    player?: Player;
    planets?: Planet[];
    enemies?: Enemy[];
  }): void {
    // Create player
    if (config.player) {
      const playerEntity = EntityFactories.createPlayerEntity(this.world, config.player);
      this.playerEntityId = this.getEntityId(playerEntity);
    } else {
      const playerEntity = EntityFactories.createBasicPlayer(this.world, 0, 0);
      this.playerEntityId = this.getEntityId(playerEntity);
    }

    // Create planets (fall back to defaults when none provided)
    if (config.planets && config.planets.length > 0) {
      config.planets.forEach((planet) => {
        EntityFactories.createPlanetEntity(this.world, planet);
      });
    } else {
      // Default selection of planets around origin
      EntityFactories.createBasicPlanet(this.world, "planet_1", 400, 300, 80);
      EntityFactories.createBasicPlanet(this.world, "planet_2", -300, -200, 60);
      EntityFactories.createBasicPlanet(this.world, "planet_3", -100, 400, 70);
      EntityFactories.createBasicPlanet(this.world, "planet_4", 500, -300, 90);
    }

    // Create enemies (fall back to defaults when none provided)
    if (config.enemies && config.enemies.length > 0) {
      config.enemies.forEach((enemy) => {
        EntityFactories.createEnemyEntity(this.world, enemy);
      });
    } else {
      EntityFactories.createBasicEnemy(this.world, "enemy_1", 200, 100);
      EntityFactories.createBasicEnemy(this.world, "enemy_2", -150, 200);
      EntityFactories.createBasicEnemy(this.world, "enemy_3", 100, -150);
    }
  }

  update(actions: Set<Action>, dt: number): void {
    // Handle landing/takeoff based on proximity and actions
    if (this.mode === "space") {
      const near = this.findNearbyPlanetId();
      if (near && actions.has("land")) {
        // Store return position (player's current pos)
        const p = this.getPlayer();
        if (p) this.returnPosition = { x: p.x, y: p.y };
        this.mode = "planet";
        this.landedPlanetId = near;
      }
    } else if (this.mode === "planet") {
      if (actions.has("takeoff")) {
        // Return to stored position if available
        if (this.returnPosition) {
          const players = this.world.query({
            position: Components.Position,
            player: Components.Player,
          });
          if (players.length > 0) {
            const { position } = players[0].components;
            position.x = this.returnPosition.x;
            position.y = this.returnPosition.y;
          }
        }
        this.mode = "space";
        this.landedPlanetId = null;
      }
    }

    // Create and run systems in order
    const playerControlSystem = createPlayerControlSystem(this.world, actions, dt);
    const weaponSystem = createWeaponSystem(this.world, actions);
    const enemyAISystem = createEnemyAISystem(this.world, dt);
    const movementSystem = createMovementSystem(this.world, dt);
    const projectileSystem = createProjectileSystem(this.world, dt);
    const collisionSystem = createCollisionSystem(this.world);

    // Run systems in order
    playerControlSystem.run();
    weaponSystem.run();
    enemyAISystem.run();
    movementSystem.run();
    projectileSystem.run();
    collisionSystem.run();

    // Update camera to follow player
    this.updateCameraFollowPlayer();

    // Update proximity notification for planets
    this.updateNotifications();
  }

  private updateCameraFollowPlayer(): void {
    if (!this.playerEntityId) return;

    const playerEntities = this.world.query({
      position: Components.Position,
      player: Components.Player,
    });
    if (playerEntities.length > 0) {
      const playerPos = playerEntities[0].components.position;
      this.camera.x = playerPos.x;
      this.camera.y = playerPos.y;
    }
  }

  // Public query methods for UI/rendering - compatible with existing GameRenderer
  getPlayer(): PlayerView | null {
    const players = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      rotation: Components.Rotation,
      health: Components.Health,
      player: Components.Player,
    });
    if (players.length === 0) return null;

    const player = players[0];
    const { position, velocity, rotation, health } = player.components;
    return {
      x: position.x,
      y: position.y,
      vx: velocity.dx,
      vy: velocity.dy,
      angle: rotation.angle,
      health: health.current,
    };
  }

  getEnemies(): Enemy[] {
    return this.world
      .query({
        position: Components.Position,
        velocity: Components.Velocity,
        rotation: Components.Rotation,
        health: Components.Health,
        enemy: Components.Enemy,
        collider: Components.Collider,
      })
      .map((enemy) => {
        const {
          position,
          velocity,
          rotation,
          health,
          enemy: enemyData,
          collider,
        } = enemy.components;
        return {
          id: enemyData.id,
          x: position.x,
          y: position.y,
          vx: velocity.dx,
          vy: velocity.dy,
          angle: rotation.angle,
          health: health.current,
          radius: collider.radius,
          // Add missing properties from Enemy type
          visionRadius: 700,
          visionHysteresis: 80,
          turnSpeed: 1.8,
          accel: 100,
          maxSpeed: 80,
        };
      });
  }

  getPlanets(): Planet[] {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        sprite: Components.Sprite,
        planet: Components.Planet,
      })
      .map((planet) => {
        const { position, collider, sprite, planet: planetData } = planet.components;
        const design: Planet["design"] = sprite.design ?? "solid";
        return {
          id: planetData.id,
          x: position.x,
          y: position.y,
          radius: collider.radius,
          color: sprite.color,
          design,
        };
      });
  }

  getProjectiles(): Circle2D[] {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        projectile: Components.Projectile,
      })
      .map((proj) => {
        const { position, collider } = proj.components;
        return {
          x: position.x,
          y: position.y,
          radius: collider.radius,
        };
      });
  }

  // Mode management (simplified for now)
  getCurrentModeType(): "space" | "planet" {
    return this.mode;
  }

  // Additional methods to match GameSession interface
  getCamera(): Camera {
    return this.camera;
  }

  getSize(): ViewSize {
    return this.size;
  }

  getNotification(): string | null {
    return this.notification;
  }

  setNotification(message: string | null): void {
    this.notification = message;
  }

  // Debug methods
  getEntityCount(): EntityCounts {
    const players = this.world.query({ player: Components.Player }).length;
    const enemies = this.world.query({ enemy: Components.Enemy }).length;
    const planets = this.world.query({ planet: Components.Planet }).length;
    const projectiles = this.world.query({ projectile: Components.Projectile }).length;

    return { players, enemies, planets, projectiles };
  }

  // Expose world for debugging
  getWorld(): World {
    return this.world;
  }

  // Helper method to safely get entity ID
  private getEntityId(entity: EntityBuilder): number {
    return entity.id;
  }

  private updateNotifications(): void {
    if (this.mode === "planet" && this.landedPlanetId) {
      this.notification = `Exploring ${this.landedPlanetId} - Press T to takeoff`;
      return;
    }
    const player = this.getPlayer();
    if (!player) {
      this.notification = null;
      return;
    }
    const near = this.findNearbyPlanetId();
    this.notification = near ? `Press L to land on ${near}` : null;
  }

  private findNearbyPlanetId(): string | null {
    const player = this.getPlayer();
    if (!player) return null;
    const planets = this.getPlanets();
    for (const p of planets) {
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (dist < p.radius + 60) return p.id;
    }
    return null;
  }
}
