import { World, type EntityBuilder } from "../../lib/ecs/dist";
import type { Player } from "../game/player";
import type { Planet } from "../game/planets";
import type { Enemy } from "../game/enemies";
import * as Components from "./components";
import * as EntityFactories from "./entities/EntityFactories";
import { createMovementSystem } from "./systems/MovementSystem";
import { createPlayerControlSystem } from "./systems/PlayerControlSystem";
import { createEnemyAISystem } from "./systems/EnemyAISystem";
import { createProjectileSystem } from "./systems/ProjectileSystem";
import { createCollisionSystem } from "./systems/CollisionSystem";
import { createWeaponSystem } from "./systems/WeaponSystem";

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;

  // Camera (keep as is for now)
  camera: { x: number; y: number; zoom: number };
  size: { width: number; height: number };
  notification: string | null = null;

  constructor(config?: {
    camera?: { x: number; y: number; zoom: number };
    player?: Player;
    planets?: Planet[];
    size?: { width: number; height: number };
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

  private createDefaultGame() {
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
  }) {
    // Create player
    if (config.player) {
      const playerEntity = EntityFactories.createPlayerEntity(this.world, config.player);
      this.playerEntityId = this.getEntityId(playerEntity);
    } else {
      const playerEntity = EntityFactories.createBasicPlayer(this.world, 0, 0);
      this.playerEntityId = this.getEntityId(playerEntity);
    }

    // Create planets
    if (config.planets) {
      config.planets.forEach((planet) => {
        EntityFactories.createPlanetEntity(this.world, planet);
      });
    }

    // Create enemies
    if (config.enemies) {
      config.enemies.forEach((enemy) => {
        EntityFactories.createEnemyEntity(this.world, enemy);
      });
    }
  }

  update(actions: Set<string>, dt: number) {
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
  }

  private updateCameraFollowPlayer() {
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
  getPlayer() {
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

  getEnemies() {
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

  getPlanets() {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        sprite: Components.Sprite,
        planet: Components.Planet,
      })
      .map((planet) => {
        const { position, collider, sprite, planet: planetData } = planet.components;
        return {
          id: planetData.id,
          x: position.x,
          y: position.y,
          radius: collider.radius,
          color: sprite.color,
          design: sprite.design || ("solid" as const),
        };
      });
  }

  getProjectiles() {
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
    return "space"; // Always space mode for now
  }

  // Additional methods to match GameSession interface
  getCamera() {
    return this.camera;
  }

  getSize() {
    return this.size;
  }

  getNotification() {
    return this.notification;
  }

  setNotification(message: string | null) {
    this.notification = message;
  }

  // Debug methods
  getEntityCount() {
    const players = this.world.query({ player: Components.Player }).length;
    const enemies = this.world.query({ enemy: Components.Enemy }).length;
    const planets = this.world.query({ planet: Components.Planet }).length;
    const projectiles = this.world.query({ projectile: Components.Projectile }).length;

    return { players, enemies, planets, projectiles };
  }

  // Expose world for debugging
  getWorld() {
    return this.world;
  }

  // Helper method to safely get entity ID
  private getEntityId(entity: EntityBuilder): number {
    return entity.id;
  }
}
