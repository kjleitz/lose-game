import type { Action } from "../../application/input";
import { Entity, type EntityBuilder, World } from "../../lib/ecs";
import type { Circle2D, ViewSize } from "../../shared/types/geometry";
import type { DroppedItem as DroppedItemShape } from "../game/items/DroppedItemSystem";
import type { Item } from "../game/items/Item";
import { generatePlanetSurfaceFor } from "../game/planet-surface/generate";
import type { PlanetSurface } from "../game/planet-surface/types";
import type { Planet } from "../game/planets";
import type { Player } from "../game/player";
import type { EnemyView as Enemy, EntityCounts, PlayerView } from "../game/views";
import { perkDefinitions } from "../leveling/perksConfig";
import type { PerkId } from "../leveling/types";
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
import { createEnemyMeleeSystem } from "./systems/EnemyMeleeSystem";
import { createEnemyRangedWeaponSystem } from "./systems/EnemyRangedWeaponSystem";
import { createHitFlashSystem } from "./systems/HitFlashSystem";
import { createLevelUpSystem, type LevelUpEvent } from "./systems/LevelUpSystem";
import { createMeleeStrikeAnimSystem } from "./systems/MeleeStrikeAnimSystem";
import { createMovementSystem } from "./systems/MovementSystem";
import { createPerkEffectsSystem } from "./systems/PerkEffectsSystem";
import { createPerkUnlockSystem, type PerkUnlockRequest } from "./systems/PerkUnlockSystem";
import { createPlanetTerrainCollisionSystem } from "./systems/PlanetTerrainCollisionSystem";
import { createPlayerControlSystem } from "./systems/PlayerControlSystem";
import { createProjectileSystem } from "./systems/ProjectileSystem";
import { createSfxEventCollectorSystem, type SfxEvent } from "./systems/SfxEventCollectorSystem";
import { createWeaponSystem } from "./systems/WeaponSystem";

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;
  private mode: "space" | "planet" = "space";
  // Coordinate spaces are distinct per mode; we map the active one into Position
  private landedPlanetId: string | null = null;
  private planetSurface: PlanetSurface | undefined;
  // When on a planet, allow entering the ship and flying above terrain
  private inPlanetShip: boolean = false;
  private pickupEvents: PickupEvent[] = [];
  private levelUpEvents: LevelUpEvent[] = [];
  private perkRequests: PerkUnlockRequest[] = [];
  private toastEvents: string[] = [];
  private sfxEvents: SfxEvent[] = [];
  private deathEvents: number = 0; // count of player-death events since last read
  private interactCooldown: number = 0; // seconds until next interact toggle allowed
  private inPlanetShipAnim: number = 0; // 0..1 takeoff animation progress
  private awaitingRespawn: boolean = false;

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
    // Position starts in space coordinates

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

    // Position starts in space coordinates

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
    // Update timers
    if (this.interactCooldown > 0) this.interactCooldown = Math.max(0, this.interactCooldown - dt);
    if (this.inPlanetShip) {
      if (this.inPlanetShipAnim < 1)
        this.inPlanetShipAnim = Math.min(1, this.inPlanetShipAnim + dt / 0.35);
    } else {
      this.inPlanetShipAnim = 0;
    }
    // Handle landing/takeoff based on proximity and actions
    if (this.mode === "space") {
      const nearbyPlanetId = this.findNearbyPlanetId();
      if (nearbyPlanetId && actions.has("land")) {
        // Enter planet mode
        this.mode = "planet";
        this.landedPlanetId = nearbyPlanetId;
        const planet = this.getPlanets().find((pl) => pl.id === nearbyPlanetId);
        if (planet) {
          // Generate a surface (planet-local coordinates)
          const surface = generatePlanetSurfaceFor({ id: planet.id, radius: planet.radius });
          // On entering planet mode, place player at the landing site (planet-local)
          const players = this.world.query({
            position: Components.Position,
            velocity: Components.Velocity,
            rotation: Components.Rotation,
            player: Components.Player,
          });
          if (players.length > 0) {
            const { position, velocity, rotation } = players[0].components;
            // Enter planet at landing site with zeroed motion
            position.x = surface.landingSite.x;
            position.y = surface.landingSite.y;
            velocity.dx = 0;
            velocity.dy = 0;
            rotation.angle = 0;
          }
          this.planetSurface = surface;
        }
        // Spawn a few creatures near landing for planet mode
        this.spawnPlanetCreatures();
        // Start in ship-on-planet state upon landing
        this.inPlanetShip = true;
        this.inPlanetShipAnim = 0;
      }
    } else if (this.mode === "planet") {
      // Enter/exit ship with C: exit anywhere; enter only near the grounded ship
      if (actions.has("interact") && this.interactCooldown <= 0) {
        const surface = this.planetSurface;
        const players = this.world.query({
          position: Components.Position,
          velocity: Components.Velocity,
          rotation: Components.Rotation,
          player: Components.Player,
        });
        if (surface && players.length > 0) {
          const { x, y } = players[0].components.position;
          if (this.inPlanetShip) {
            // Exit ship anywhere: drop ship at current player position
            surface.landingSite = { x, y };
            this.inPlanetShip = false;
            this.interactCooldown = 0.25;
          } else {
            // Enter ship only when near grounded ship
            const dx = x - surface.landingSite.x;
            const dy = y - surface.landingSite.y;
            const nearLanding = Math.hypot(dx, dy) <= 64;
            if (nearLanding) {
              this.inPlanetShip = true;
              this.inPlanetShipAnim = 0;
              this.interactCooldown = 0.25;
            }
          }
        }
      }
      if (actions.has("takeoff")) {
        // Takeoff requires being in the ship, but not proximity to landing site
        const players = this.world.query({
          position: Components.Position,
          velocity: Components.Velocity,
          rotation: Components.Rotation,
          player: Components.Player,
        });
        if (this.inPlanetShip) {
          // Place player hovering over the planet in space coordinates
          const planet = this.landedPlanetId
            ? this.getPlanets().find((pl) => pl.id === this.landedPlanetId)
            : undefined;
          if (planet && players.length > 0) {
            const { position, velocity, rotation } = players[0].components;
            // Hover just outside the planet radius to the east
            position.x = planet.x + planet.radius + 70;
            position.y = planet.y;
            // Reset motion and face right for a clean start
            velocity.dx = 0;
            velocity.dy = 0;
            rotation.angle = 0;
            // Snap camera immediately so the ship is centered this frame
            this.camera.x = position.x;
            this.camera.y = position.y;
          }
          this.mode = "space";
          this.landedPlanetId = null;
          this.planetSurface = undefined;
          this.inPlanetShip = false;
        }
      }
    }

    // Create and run systems in order
    const perkEffectsSystem = createPerkEffectsSystem(this.world);
    // In planet mode, use ship-style controls if the player is flying the ship
    const controlMode: "space" | "planet" =
      this.mode === "planet" && this.inPlanetShip ? "space" : this.mode;
    const playerControlSystem = createPlayerControlSystem(
      this.world,
      actions,
      dt,
      controlMode,
      this.mode === "planet" && this.inPlanetShip
        ? { spaceAccelMult: 2.5, spaceMaxSpeedMult: 3.0, spaceTurnMult: 1.5 }
        : undefined,
    );
    const weaponSystem = createWeaponSystem(this.world, actions);
    const enemyAISystem = createEnemyAISystem(this.world, dt);
    const enemyRangedSystem = createEnemyRangedWeaponSystem(this.world, dt);
    const enemyMeleeSystem = createEnemyMeleeSystem(this.world, dt);
    const movementSystem = createMovementSystem(this.world, dt);
    const meleeAnimSystem = createMeleeStrikeAnimSystem(this.world, dt);
    const projectileSystem = createProjectileSystem(this.world, dt);
    const hitFlashSystem = createHitFlashSystem(this.world, dt);
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
    const sfxSystem = createSfxEventCollectorSystem(this.world, (ev) => {
      this.sfxEvents.push(ev);
    });
    const pickupSystem = createPickupSystem(this.world, actions, (ev): void => {
      this.pickupEvents.push(ev);
    });

    // Run systems in order
    // Recompute modifiers then apply player controls
    perkEffectsSystem.run();
    playerControlSystem.run();
    weaponSystem.run();
    enemyAISystem.run();
    // Enemy attacks: space ships fire; planet creatures strike
    if (this.mode === "space") {
      enemyRangedSystem.run();
    } else if (this.mode === "planet") {
      enemyMeleeSystem.run();
    }
    movementSystem.run();
    // Planet terrain blocking after movement
    if (this.mode === "planet" && !this.inPlanetShip) {
      const blocker = createPlanetTerrainCollisionSystem(this.world, () => this.planetSurface);
      blocker.run();
    }
    projectileSystem.run();
    hitFlashSystem.run();
    meleeAnimSystem.run();
    collisionSystem.run();
    sfxSystem.run();
    dropAgingSystem.run();
    pickupSystem.run();
    // Level-up after any XP-changing actions this frame
    levelUpSystem.run();
    // Process any perk unlock requests
    perkSystem.run();

    // Update camera to follow player
    this.updateCameraFollowPlayer();

    // Auto-collect nearby planet resources with attraction toward player
    if (this.mode === "planet") {
      this.collectNearbyResources(dt);
    }

    // Re-check for level-ups in case resource collection granted XP
    levelUpSystem.run();
    // Re-run perk system in case points changed (not necessary but safe)
    perkSystem.run();

    // Update proximity notification for planets
    this.updateNotifications();

    // Check for death in any mode and mark awaiting respawn
    this.checkDeathAndMarkIfNeeded();

    // Active Position is authoritative for the current mode; no cross-mode syncing here
  }

  private checkDeathAndMarkIfNeeded(): void {
    // Player removed (e.g., killed by projectile) OR has health <= 0 (e.g., melee on planet)
    const players = this.world.query({ player: Components.Player, health: Components.Health });
    const noPlayer = players.length === 0;
    const deadByHealth = !noPlayer && players[0].components.health.current <= 0;
    if ((noPlayer || deadByHealth) && !this.awaitingRespawn) {
      this.deathEvents += 1;
      // Toast for feedback; UI shows overlay and awaits player input
      this.toastEvents.push("You died.");
      // Do not reset immediately; wait for explicit respawn
      // Mark internal flag so UI can query if needed
      this.awaitingRespawn = true;
    }
  }

  private hardResetToNewGame(): void {
    // Recreate world and default entities
    this.world = new World();
    this.playerEntityId = null;
    this.mode = "space";
    this.landedPlanetId = null;
    this.planetSurface = undefined;
    this.inPlanetShip = false;
    this.interactCooldown = 0;
    this.inPlanetShipAnim = 0;
    this.notification = null;
    this.pickupEvents = [];
    this.levelUpEvents = [];
    this.perkRequests = [];
    this.sfxEvents = [];
    // Camera back to origin
    this.camera.x = 0;
    this.camera.y = 0;
    // Build a fresh default game state
    this.createDefaultGame();
    // Clear awaitingRespawn marker
    this.awaitingRespawn = false;
  }

  // Application can observe death and clear persisted data
  getAndClearDeathEvents(): number {
    const count = this.deathEvents;
    this.deathEvents = 0;
    return count;
  }

  // Soft capability for UI to check or trigger respawn without casts
  isAwaitingRespawn(): boolean {
    return this.awaitingRespawn;
  }

  respawnFromDeath(): void {
    if (!this.isAwaitingRespawn()) return;
    this.hardResetToNewGame();
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
    const hf = ent.getComponent(Components.HitFlash);
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
      ...(hf && hf.remaining > 0
        ? { hitFlash: { progress: Math.max(0, Math.min(1, 1 - hf.remaining / hf.duration)) } }
        : {}),
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
        const ent = new Entity(enemy.entity, this.world);
        const swing = ent.getComponent(Components.MeleeStrikeAnim);
        const hf = ent.getComponent(Components.HitFlash);
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
          ...(swing && swing.remaining > 0
            ? {
                meleeSwing: {
                  progress: Math.max(0, Math.min(1, 1 - swing.remaining / swing.duration)),
                  angle: swing.angle,
                  reach: swing.reach,
                  arc: swing.arc,
                },
              }
            : {}),
          ...(hf && hf.remaining > 0
            ? { hitFlash: { progress: Math.max(0, Math.min(1, 1 - hf.remaining / hf.duration)) } }
            : {}),
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
    faction?: "player" | "enemy" | "neutral";
  }> {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        projectile: Components.Projectile,
        velocity: Components.Velocity,
        // faction is optional
      })
      .map((proj) => {
        const { position, collider, velocity } = proj.components;
        const ent = new Entity(proj.entity, this.world);
        return {
          id: proj.entity,
          x: position.x,
          y: position.y,
          radius: collider.radius,
          vx: velocity.dx,
          vy: velocity.dy,
          faction: ent.getComponent(Components.Faction)?.team,
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

  getAndClearSfxEvents(): SfxEvent[] {
    const out = [...this.sfxEvents];
    this.sfxEvents = [];
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

  // Planet-mode ship state (for renderer/UI)
  isInPlanetShip(): boolean {
    return this.mode === "planet" && this.inPlanetShip;
  }

  // Expose ship enter animation progress (0..1) for renderer
  getInPlanetShipProgress(): number {
    return this.inPlanetShip ? this.inPlanetShipAnim : 0;
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
    // Planet mode: show exploring hint; exit ship anywhere; enter/takeoff near ship
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
      const hints: string[] = [];
      if (this.inPlanetShip) {
        hints.push("Press C to exit ship");
        hints.push("Press T to takeoff");
      } else if (nearLanding) {
        hints.push("Press C to enter ship");
      }
      this.notification =
        `Exploring ${this.landedPlanetId}` + (hints.length ? ` - ${hints.join(" | ")}` : "");
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
  private collectNearbyResources(dt: number): void {
    if (!this.planetSurface) return;
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const playerPos = players[0].components.position;
    const xpEntities = this.world.query({
      player: Components.Player,
      experience: Components.PlayerExperience,
    });
    const xp = xpEntities.length > 0 ? xpEntities[0].components.experience : null;

    // Radii and attraction parameters
    const PICKUP_RADIUS = 30; // actual collection radius
    const ATTRACTION_RADIUS = 140; // begin pulling resources toward player
    const MAX_PULL_SPEED = 260; // px/s near player, tapered at edge
    const { resources } = this.planetSurface;
    for (let i = resources.length - 1; i >= 0; i--) {
      const resource = resources[i];
      const dx = playerPos.x - resource.x;
      const dy = playerPos.y - resource.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= PICKUP_RADIUS) {
        // Remove collected resource and award XP if available
        resources.splice(i, 1);
        if (xp) {
          xp.current += resource.amount;
          // Level progression can be added later
        }
      } else if (dist <= ATTRACTION_RADIUS) {
        // Pull resource toward player.
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const proximityFactor = Math.max(0, Math.min(1, 1 - dist / ATTRACTION_RADIUS));
        const speed = MAX_PULL_SPEED * proximityFactor;
        const step = speed * dt;
        resource.x += nx * step;
        resource.y += ny * step;
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
