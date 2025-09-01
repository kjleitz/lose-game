import type { Action } from "../../engine";
import { type EntityBuilder, World, Entity } from "../../lib/ecs";
import type { Circle2D, ViewSize } from "../../shared/types/geometry";
import type { Enemy } from "../game/enemies";
import type { DroppedItem as DroppedItemShape } from "../game/items/DroppedItemSystem";
import type { Item } from "../game/items/Item";
import { generatePlanetSurfaceFor } from "../game/planet-surface/generate";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Planet } from "../game/planets";
import type { Player } from "../game/player";
import type { EntityCounts, PlayerView } from "../game/views";
import type { Camera } from "../render/camera";
import * as Components from "./components";
import * as EntityFactories from "./entities/EntityFactories";
import { createCollisionSystem } from "./systems/CollisionSystem";
import {
  createDroppedItemAgingSystem,
  createPickupSystem,
  type PickupEvent,
} from "./systems/DroppedItemSystem";
import { createEnemyAISystem } from "./systems/EnemyAISystem";
import { createMovementSystem } from "./systems/MovementSystem";
import { createPerkEffectsSystem } from "./systems/PerkEffectsSystem";
import { createPlanetTerrainCollisionSystem } from "./systems/PlanetTerrainCollisionSystem";
import { createPlayerControlSystem } from "./systems/PlayerControlSystem";
import { createProjectileSystem } from "./systems/ProjectileSystem";
import { createWeaponSystem } from "./systems/WeaponSystem";
import { createLevelUpSystem, type LevelUpEvent } from "./systems/LevelUpSystem";
import { createPerkUnlockSystem, type PerkUnlockRequest } from "./systems/PerkUnlockSystem";
import { perkDefinitions } from "../leveling/perksConfig";
import type { PerkId } from "../leveling/types";

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;
  private mode: "space" | "planet" = "space";
  private returnPosition: { x: number; y: number } | null = null;
  private landedPlanetId: string | null = null;
  private planetSurface: PlanetSurface | undefined;
  private pickupEvents: PickupEvent[] = [];
  private levelUpEvents: LevelUpEvent[] = [];
  private perkRequests: PerkUnlockRequest[] = [];
  private toastEvents: string[] = [];

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
      const nearbyPlanetId = this.findNearbyPlanetId();
      if (nearbyPlanetId && actions.has("land")) {
        // Store return position (player's current pos)
        const playerView = this.getPlayer();
        if (playerView) this.returnPosition = { x: playerView.x, y: playerView.y };
        this.mode = "planet";
        this.landedPlanetId = nearbyPlanetId;
        const planet = this.getPlanets().find((pl) => pl.id === nearbyPlanetId);
        if (planet)
          this.planetSurface = generatePlanetSurfaceFor({ id: planet.id, radius: planet.radius });
        // Spawn a few creatures near landing for planet mode
        this.spawnPlanetCreatures();
      }
    } else if (this.mode === "planet") {
      if (actions.has("takeoff")) {
        // Require proximity to landing site
        const surface = this.planetSurface;
        const players = this.world.query({
          position: Components.Position,
          player: Components.Player,
        });
        let nearLanding = false;
        if (surface && players.length > 0) {
          const { x, y } = players[0].components.position;
          const dx = x - surface.landingSite.x;
          const dy = y - surface.landingSite.y;
          nearLanding = Math.hypot(dx, dy) <= 64;
        }

        if (nearLanding) {
          // Return to stored position if available
          if (this.returnPosition && players.length > 0) {
            const { position } = players[0].components;
            position.x = this.returnPosition.x;
            position.y = this.returnPosition.y;
          }
          this.mode = "space";
          this.landedPlanetId = null;
          this.planetSurface = undefined;
        }
      }
    }

    // Create and run systems in order
    const perkEffectsSystem = createPerkEffectsSystem(this.world);
    const playerControlSystem = createPlayerControlSystem(this.world, actions, dt, this.mode);
    const weaponSystem = createWeaponSystem(this.world, actions);
    const enemyAISystem = createEnemyAISystem(this.world, dt);
    const movementSystem = createMovementSystem(this.world, dt);
    const projectileSystem = createProjectileSystem(this.world, dt);
    const levelUpSystem = createLevelUpSystem(this.world, (ev) => {
      this.levelUpEvents.push(ev);
      // Emit as a transient toast instead of hijacking the HUD hint
      this.toastEvents.push(`Level Up! Reached level ${ev.newLevel}`);
    });
    const perkSystem = createPerkUnlockSystem(
      this.world,
      this.perkRequests,
      perkDefinitions,
      (res) => {
        if (res.success) {
          this.toastEvents.push("Perk unlocked!");
        } else {
          // Consider emitting a failure toast in the future with more detail
        }
      },
    );
    const collisionSystem = createCollisionSystem(this.world);
    const dropAgingSystem = createDroppedItemAgingSystem(this.world, dt);
    const pickupSystem = createPickupSystem(this.world, actions, (ev): void => {
      this.pickupEvents.push(ev);
    });

    // Run systems in order
    // Recompute modifiers then apply player controls
    perkEffectsSystem.run();
    playerControlSystem.run();
    weaponSystem.run();
    enemyAISystem.run();
    movementSystem.run();
    // Planet terrain blocking after movement
    if (this.mode === "planet") {
      const blocker = createPlanetTerrainCollisionSystem(this.world, () => this.planetSurface);
      blocker.run();
    }
    projectileSystem.run();
    collisionSystem.run();
    dropAgingSystem.run();
    pickupSystem.run();
    // Level-up after any XP-changing actions this frame
    levelUpSystem.run();
    // Process any perk unlock requests
    perkSystem.run();

    // Update camera to follow player
    this.updateCameraFollowPlayer();

    // Auto-collect nearby planet resources (matches classic PlanetMode behavior)
    if (this.mode === "planet") {
      this.collectNearbyResources();
    }

    // Re-check for level-ups in case resource collection granted XP
    levelUpSystem.run();
    // Re-run perk system in case points changed (not necessary but safe)
    perkSystem.run();

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
      experience: Components.PlayerExperience,
    });
    if (players.length === 0) return null;

    const player = players[0];
    const { position, velocity, rotation, health, experience } = player.components;
    const ent = new Entity(player.entity, this.world);
    const perk = ent.getComponent(Components.PlayerPerkPoints);
    return {
      x: position.x,
      y: position.y,
      vx: velocity.dx,
      vy: velocity.dy,
      angle: rotation.angle,
      health: health.current,
      experience: experience.current,
      level: experience.level,
      xpToNextLevel: experience.toNextLevel,
      perkPoints: perk ? perk.unspent : 0,
      // expose unlocked perks to HUD/UI
      perks: ent.getComponent(Components.Perks)?.unlocked ?? {},
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

  // Detailed projectile view for renderers that want heading/trails in space mode
  getProjectilesDetailed(): Array<{
    id: number;
    x: number;
    y: number;
    radius: number;
    vx: number;
    vy: number;
  }> {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        projectile: Components.Projectile,
        velocity: Components.Velocity,
      })
      .map((proj) => {
        const { position, collider, velocity } = proj.components;
        return {
          id: proj.entity,
          x: position.x,
          y: position.y,
          radius: collider.radius,
          vx: velocity.dx,
          vy: velocity.dy,
        };
      });
  }

  getDroppedItems(): DroppedItemShape[] {
    return this.world
      .query({ position: Components.Position, dropped: Components.DroppedItem })
      .map((entity) => {
        const { position, dropped } = entity.components;
        return {
          id: `d_${entity.entity}`,
          item: dropped.item,
          quantity: dropped.quantity,
          x: position.x,
          y: position.y,
          ageSeconds: dropped.ageSeconds,
          sourceEntity: undefined,
        };
      });
  }

  getAndClearPickupEvents(): Array<{ item: Item; quantity: number }> {
    const out = [...this.pickupEvents];
    this.pickupEvents = [];
    return out;
  }

  getAndClearLevelUpEvents(): LevelUpEvent[] {
    const out = [...this.levelUpEvents];
    this.levelUpEvents = [];
    return out;
  }

  getAndClearToastEvents(): string[] {
    const out = [...this.toastEvents];
    this.toastEvents = [];
    return out;
  }

  requestUnlockPerk(perkId: PerkId): void {
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    this.perkRequests.push({ entityId: players[0].entity, perkId });
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
    // Planet mode: show exploring hint and only gate takeoff prompt near landing site
    if (this.mode === "planet" && this.landedPlanetId) {
      const players = this.world.query({
        position: Components.Position,
        player: Components.Player,
      });
      const surface = this.planetSurface;
      let nearLanding = false;
      if (surface && players.length > 0) {
        const { x, y } = players[0].components.position;
        const dx = x - surface.landingSite.x;
        const dy = y - surface.landingSite.y;
        nearLanding = Math.hypot(dx, dy) <= 64;
      }
      this.notification =
        `Exploring ${this.landedPlanetId}` + (nearLanding ? " - Press T to takeoff" : "");
      return;
    }
    // Space mode proximity hint to land
    const player = this.getPlayer();
    if (!player) {
      this.notification = null;
      return;
    }
    const nearbyPlanetId = this.findNearbyPlanetId();
    this.notification = nearbyPlanetId ? `Press L to land on ${nearbyPlanetId}` : null;
  }

  private findNearbyPlanetId(): string | null {
    const player = this.getPlayer();
    if (!player) return null;
    const planets = this.getPlanets();
    for (const planet of planets) {
      const dist = Math.hypot(player.x - planet.x, player.y - planet.y);
      if (dist < planet.radius + 60) return planet.id;
    }
    return null;
  }

  // Expose planet surface for renderer (ECS path)
  getPlanetSurface(): PlanetSurface | undefined {
    return this.planetSurface;
  }

  // Collect planet resources (e.g., energy/mineral/organic) when the player is close
  private collectNearbyResources(): void {
    if (!this.planetSurface) return;
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const playerPos = players[0].components.position;
    const xpEntities = this.world.query({
      player: Components.Player,
      experience: Components.PlayerExperience,
    });
    const xp = xpEntities.length > 0 ? xpEntities[0].components.experience : null;

    // Match classic collection radius
    const RADIUS = 30;
    const { resources } = this.planetSurface;
    for (let i = resources.length - 1; i >= 0; i--) {
      const resource = resources[i];
      const dist = Math.hypot(playerPos.x - resource.x, playerPos.y - resource.y);
      if (dist < RADIUS) {
        // Remove collected resource and award XP if available
        resources.splice(i, 1);
        if (xp) {
          xp.current += resource.amount;
          // Level progression can be added later
        }
      }
    }
  }

  // Allow application layer to set player position on load/restore
  setPlayerPosition(pos: { x: number; y: number }): void {
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const { position } = players[0].components;
    position.x = pos.x;
    position.y = pos.y;
    // Reset camera to follow immediately
    this.camera.x = pos.x;
    this.camera.y = pos.y;
  }

  getModeSnapshot(): { mode: "space" | "planet"; planetId?: string } {
    return { mode: this.mode, planetId: this.landedPlanetId ?? undefined };
  }

  restoreMode(data: { mode: "space" | "planet"; planetId?: string }): void {
    if (data.mode === "planet") {
      this.mode = "planet";
      this.landedPlanetId = data.planetId ?? null;
      if (this.landedPlanetId) {
        const planet = this.getPlanets().find((pl) => pl.id === this.landedPlanetId);
        if (planet)
          this.planetSurface = generatePlanetSurfaceFor({ id: planet.id, radius: planet.radius });
      }
    } else {
      this.mode = "space";
      this.landedPlanetId = null;
      this.planetSurface = undefined;
    }
    this.updateNotifications();
  }

  // generatePlanetSurface is now shared in domain/game/planet-surface/generate.ts

  private spawnPlanetCreatures(): void {
    // Spawn simple enemies near player when entering planet mode
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const base = players[0].components.position;
    const count = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 120 + Math.random() * 180;
      EntityFactories.createBasicEnemy(
        this.world,
        `creature_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
        base.x + Math.cos(angle) * distance,
        base.y + Math.sin(angle) * distance,
      );
    }
  }
}
