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
import { createOrbitSystem } from "./systems/OrbitSystem";
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
import { createPerkSellSystem, type PerkSellRequest } from "./systems/PerkSellSystem";
import { createPlanetTerrainCollisionSystem } from "./systems/PlanetTerrainCollisionSystem";
import { createPlayerControlSystem } from "./systems/PlayerControlSystem";
import { createProjectileSystem } from "./systems/ProjectileSystem";
import { createSfxEventCollectorSystem, type SfxEvent } from "./systems/SfxEventCollectorSystem";
import { applyGravityTo } from "../physics/gravity";
import { createWeaponSystem } from "./systems/WeaponSystem";
import type { AmmoType } from "../../shared/types/combat";

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;
  private mode: "space" | "planet" = "space";
  // Coordinate spaces are distinct per mode; we map the active one into Position
  private landedPlanetId: string | null = null;
  private planetSurface: PlanetSurface | undefined;
  // When on a planet, allow entering the ship and flying above terrain
  private inPlanetShip: boolean = false;
  private starHeat: { angle: number; intensity: number } | null = null;
  private gravityCooldown: number = 0; // seconds to skip gravity after takeoff
  private underPlanetGravity: boolean = false; // whether player is currently within planetary gravity influence
  private pickupEvents: PickupEvent[] = [];
  private levelUpEvents: LevelUpEvent[] = [];
  private perkRequests: PerkUnlockRequest[] = [];
  private perkSellRequests: PerkSellRequest[] = [];
  private toastEvents: string[] = [];
  private sfxEvents: SfxEvent[] = [];
  // Transient render FX events for the renderer (non-audio)
  private renderFxEvents: Array<{ type: "burn"; x: number; y: number }> = [];
  private enemyStarHeatOverlays: Array<{ id: string; angle: number; intensity: number }> = [];
  private deathEvents: number = 0; // count of player-death events since last read
  private interactCooldown: number = 0; // seconds until next interact toggle allowed
  private inPlanetShipAnim: number = 0; // 0..1 takeoff animation progress
  private awaitingRespawn: boolean = false;

  // Camera (keep as is for now)
  camera: Camera;
  // Internal camera velocity for smooth follow in ship
  private cameraVx: number = 0;
  private cameraVy: number = 0;
  // Lookahead state derived from acceleration (fades to zero at steady motion)
  private lookaheadX: number = 0;
  private lookaheadY: number = 0;
  private prevPlayerVx: number = 0;
  private prevPlayerVy: number = 0;
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

  // Update the player's cursor target (world coordinates). Used for separate aim on planets.
  setCursorTarget(point: { x: number; y: number }): void {
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const ent = new Entity(players[0].entity, this.world);
    const comp = ent.getComponent(Components.CursorTarget);
    if (comp) {
      comp.x = point.x;
      comp.y = point.y;
    } else {
      ent.addComponent(Components.CursorTarget, { x: point.x, y: point.y });
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

    // Create a few solar systems: big burning stars with orbiting planets
    this.createSolarNeighborhood();
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
      // Default: create orbiting planets around stars
      this.createSolarNeighborhood();
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
    this.updateTimers(dt);
    this.handleModeTransitions(actions);
    this.runEcsSystems(actions, dt);
    this.updateCameraFollowPlayer(dt);
    this.updateNotifications();
    this.checkDeathAndMarkIfNeeded();
    // Active Position is authoritative for the current mode; no cross-mode syncing here
  }

  getSelectedAmmo(): AmmoType {
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return "standard";
    const ent = new Entity(players[0].entity, this.world);
    const sel = ent.getComponent(Components.SelectedAmmo);
    return sel ? sel.type : "standard";
  }

  setSelectedAmmo(type: AmmoType): void {
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    const ent = new Entity(players[0].entity, this.world);
    const sel = ent.getComponent(Components.SelectedAmmo);
    if (sel) sel.type = type;
    else ent.addComponent(Components.SelectedAmmo, { type });
  }

  // --- Frame helpers ---
  private updateTimers(dt: number): void {
    if (this.interactCooldown > 0) this.interactCooldown = Math.max(0, this.interactCooldown - dt);
    if (this.gravityCooldown > 0) this.gravityCooldown = Math.max(0, this.gravityCooldown - dt);
    if (this.inPlanetShip) {
      if (this.inPlanetShipAnim < 1)
        this.inPlanetShipAnim = Math.min(1, this.inPlanetShipAnim + dt / 0.35);
    } else {
      this.inPlanetShipAnim = 0;
    }
  }

  private handleModeTransitions(actions: Set<Action>): void {
    if (this.mode === "space") {
      this.handleSpaceModeTransitions(actions);
    } else {
      this.handlePlanetModeTransitions(actions);
    }
  }

  private handleSpaceModeTransitions(actions: Set<Action>): void {
    const nearbyPlanetId = this.findNearbyPlanetId();
    if (!(nearbyPlanetId != null && actions.has("land"))) return;

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
        position.x = surface.landingSite.x;
        position.y = surface.landingSite.y;
        velocity.dx = 0;
        velocity.dy = 0;
        // Preserve ship facing angle from space when landing
        surface.shipAngle = rotation.angle;
      }
      this.planetSurface = surface;
    }
    // Spawn a few creatures near landing for planet mode
    this.spawnPlanetCreatures();
    // Start in ship-on-planet state upon landing
    this.inPlanetShip = true;
    this.inPlanetShipAnim = 0;
  }

  private handlePlanetModeTransitions(actions: Set<Action>): void {
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
          // Remember ship's current facing when parked
          surface.shipAngle = players[0].components.rotation.angle;
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
            // Align ship's facing to the stored grounded angle if available
            const rot = players[0].components.rotation;
            if (typeof surface.shipAngle === "number") rot.angle = surface.shipAngle;
            this.interactCooldown = 0.25;
          }
        }
      }
    }

    if (!actions.has("takeoff")) return;

    // Takeoff requires being in the ship, but not proximity to landing site
    const players = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      rotation: Components.Rotation,
      player: Components.Player,
    });
    if (!this.inPlanetShip) return;

    // Place player hovering over the planet in space coordinates
    const planet =
      this.landedPlanetId != null
        ? this.getPlanets().find((pl) => pl.id === this.landedPlanetId)
        : undefined;
    if (planet != null && players.length > 0) {
      const { position, velocity } = players[0].components;
      // Hover just outside the planet radius to the east
      position.x = planet.x + planet.radius + 70;
      position.y = planet.y;
      // Reset motion and face right for a clean start
      velocity.dx = 0;
      velocity.dy = 0;
      // Preserve current ship facing on takeoff (do not override angle)
      // Snap camera immediately so the ship is centered this frame
      this.camera.x = position.x;
      this.camera.y = position.y;
      this.cameraVx = 0;
      this.cameraVy = 0;
      this.lookaheadX = 0;
      this.lookaheadY = 0;
    }
    this.mode = "space";
    this.landedPlanetId = null;
    this.planetSurface = undefined;
    this.inPlanetShip = false;
    // Grace period to avoid immediate gravity tug on takeoff frame
    this.gravityCooldown = 0.1;
    // Clear any planet/star heat overlay remnants when leaving planet
    this.starHeat = null;
  }

  private runEcsSystems(actions: Set<Action>, dt: number): void {
    const perkEffectsSystem = createPerkEffectsSystem(this.world);
    // In planet mode, use ship-style controls if the player is flying the ship
    const controlMode: "space" | "planet" =
      this.mode === "planet" && this.inPlanetShip ? "space" : this.mode;
    const controlTuning =
      this.mode === "planet" && this.inPlanetShip
        ? { spaceAccelMult: 2.5, spaceMaxSpeedMult: 3.0, spaceTurnMult: 1.5 }
        : this.mode === "space" && this.underPlanetGravity
          ? { spaceDragOverride: 0.996 }
          : undefined;
    const playerControlSystem = createPlayerControlSystem(
      this.world,
      actions,
      dt,
      controlMode,
      controlTuning,
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
      this.toastEvents.push(`Level Up! Reached level ${ev.newLevel}`);
    });
    const perkSystem = createPerkUnlockSystem(
      this.world,
      this.perkRequests,
      perkDefinitions,
      (res) => {
        if (res.success) {
          if (res.perkId === "combat.cursor-aim-planet") {
            this.toastEvents.push("Cursor aim enabled: move mouse to aim; click to shoot.");
          } else if (res.perkId === "combat.new-ammo-and-weapons") {
            this.toastEvents.push("New ammo unlocked: projectiles vary by weapon type.");
          } else if (res.perkId === "thrusters.reverse-thrusters") {
            this.toastEvents.push("Reverse thrusters: in space, hold S/Down to brake.");
          } else if (res.perkId === "thrusters.strafing-thrusters") {
            this.toastEvents.push("Strafing: in space, hold Shift + A/D or Left/Right.");
          } else {
            this.toastEvents.push("Perk unlocked!");
          }
        }
      },
    );
    const perkSellSystem = createPerkSellSystem(
      this.world,
      this.perkSellRequests,
      perkDefinitions,
      (res) => {
        if (res.success) {
          this.toastEvents.push("Perk sold. Refunded perk points.");
        }
      },
    );
    const collisionSystem = createCollisionSystem(this.world);
    const dropAgingSystem = createDroppedItemAgingSystem(this.world, dt);
    const sfxSystem = createSfxEventCollectorSystem(this.world, (ev) => {
      this.sfxEvents.push(ev);
    });
    const pickupSystem = createPickupSystem(
      this.world,
      actions,
      (ev): void => {
        this.pickupEvents.push(ev);
        this.sfxEvents.push({ type: "pickup" });
      },
      40,
      (strength): void => {
        this.sfxEvents.push({ type: "attract", strength });
      },
    );

    // Run systems in order
    perkEffectsSystem.run();
    playerControlSystem.run();
    weaponSystem.run();
    enemyAISystem.run();
    if (this.mode === "space") {
      enemyRangedSystem.run();
    } else if (this.mode === "planet") {
      enemyMeleeSystem.run();
    }
    createOrbitSystem(this.world, dt).run();
    if (this.mode === "space" && this.gravityCooldown <= 0) {
      this.applyGravity(dt);
      this.applyStarHazard(dt);
    }
    movementSystem.run();
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
    if (this.mode === "planet") this.attractAndPromoteNearbyResources(dt);
    pickupSystem.run();
    levelUpSystem.run();
    perkSystem.run();
    perkSellSystem.run();
    // Re-check after any late XP changes
    levelUpSystem.run();
    perkSystem.run();
    perkSellSystem.run();
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
    this.cameraVx = 0;
    this.cameraVy = 0;
    this.lookaheadX = 0;
    this.lookaheadY = 0;
    this.prevPlayerVx = 0;
    this.prevPlayerVy = 0;
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

  setPlayerPerkPoints(unspent: number): void {
    const value = Math.max(0, Math.floor(unspent));
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    const ent = new Entity(players[0].entity, this.world);
    const points = ent.getComponent(Components.PlayerPerkPoints);
    if (points) points.unspent = value;
    else ent.addComponent(Components.PlayerPerkPoints, { unspent: value });
  }

  private updateCameraFollowPlayer(dt: number): void {
    if (this.playerEntityId == null) return;

    const playerEntities = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      player: Components.Player,
    });
    if (playerEntities.length > 0) {
      const playerPos = playerEntities[0].components.position;
      const playerVel = playerEntities[0].components.velocity;
      // Compute lookahead target offset based on acceleration only (no turn anticipation)
      const safeDt = Math.max(1e-5, dt);
      const ax = (playerVel.dx - this.prevPlayerVx) / safeDt;
      const ay = (playerVel.dy - this.prevPlayerVy) / safeDt;
      // Predictive lookahead: 0.5 * a * t^2 in world coords
      const tLead = 0.9; // seconds, feel of how far to peek ahead
      const maxLead = 160; // clamp radius
      const targetLeadX = 0.5 * ax * tLead * tLead;
      const targetLeadY = 0.5 * ay * tLead * tLead;
      // Ease lookahead toward target and decay when inputs calm down
      const leadAlpha = 1 - Math.exp(-safeDt / 0.12); // quick but smooth
      // Clamp the target before blending to avoid sudden spikes
      const targetMag = Math.hypot(targetLeadX, targetLeadY);
      const clampedTX = targetMag > maxLead ? (targetLeadX * maxLead) / targetMag : targetLeadX;
      const clampedTY = targetMag > maxLead ? (targetLeadY * maxLead) / targetMag : targetLeadY;
      this.lookaheadX += (clampedTX - this.lookaheadX) * leadAlpha;
      this.lookaheadY += (clampedTY - this.lookaheadY) * leadAlpha;
      // Ship camera: smooth follow with a gentle lag; on foot: snap follow
      const inShip = this.mode === "space" || (this.mode === "planet" && this.inPlanetShip);
      if (inShip) {
        // Critically-damped spring toward the player's position and velocity.
        // This produces an initial lag that fully catches up (no steady-state error)
        // even at constant player velocity.
        const wn = 3.8; // natural frequency (~1s settle to center)
        const damping = 2 * wn; // critical damping (zeta = 1)
        const tx = playerPos.x + this.lookaheadX;
        const ty = playerPos.y + this.lookaheadY;
        const axCam = -damping * (this.cameraVx - playerVel.dx) - wn * wn * (this.camera.x - tx);
        const ayCam = -damping * (this.cameraVy - playerVel.dy) - wn * wn * (this.camera.y - ty);
        this.cameraVx += axCam * dt;
        this.cameraVy += ayCam * dt;
        this.camera.x += this.cameraVx * dt;
        this.camera.y += this.cameraVy * dt;
      } else {
        // On foot, keep the camera locked to the player
        this.camera.x = playerPos.x;
        this.camera.y = playerPos.y;
        // Keep velocity aligned so re-entering ship starts from a stable state
        this.cameraVx = playerVel.dx;
        this.cameraVy = playerVel.dy;
        this.lookaheadX = 0;
        this.lookaheadY = 0;
      }
      // Remember for next frame
      this.prevPlayerVx = playerVel.dx;
      this.prevPlayerVy = playerVel.dy;
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
      healthMax: health.max,
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
    ammo?: import("../../shared/types/combat").AmmoType;
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
          ammo: ent.getComponent(Components.ProjectileAmmo)?.type,
        };
      });
  }

  // Stars for rendering (space mode)
  getStars(): Array<{ id: string; x: number; y: number; radius: number; color: string }> {
    return this.world
      .query({
        position: Components.Position,
        collider: Components.Collider,
        star: Components.Star,
        sprite: Components.Sprite,
      })
      .map((ent) => {
        const { position, collider, star, sprite } = ent.components;
        return {
          id: star.id,
          x: position.x,
          y: position.y,
          radius: collider.radius,
          color: sprite.color,
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

  // Provide star heat overlay parameters for renderer when near a star (player)
  getPlayerStarHeatOverlay(): { angle: number; intensity: number } | null {
    return this.starHeat;
  }

  getAndClearPickupEvents(): Array<PickupEvent> {
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

  // Visual FX events for the renderer (kept separate from audio SFX).
  getAndClearRenderFxEvents(): Array<{ type: "burn"; x: number; y: number }> {
    const out = [...this.renderFxEvents];
    this.renderFxEvents = [];
    return out;
  }

  // Enemy star heat overlays for renderer (space mode)
  getEnemyStarHeatOverlays(): Array<{ id: string; angle: number; intensity: number }> {
    return this.enemyStarHeatOverlays;
  }

  requestUnlockPerk(perkId: PerkId): void {
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    this.perkRequests.push({ entityId: players[0].entity, perkId });
  }

  // Run only the perk unlock system once (useful while UI is paused)
  applyPendingPerkUnlocks(): void {
    const perkSystem = createPerkUnlockSystem(
      this.world,
      this.perkRequests,
      perkDefinitions,
      (res) => {
        if (res.success) {
          if (res.perkId === "combat.cursor-aim-planet") {
            this.toastEvents.push("Cursor aim enabled: move mouse to aim; click to shoot.");
          } else if (res.perkId === "combat.new-ammo-and-weapons") {
            this.toastEvents.push("New ammo unlocked: projectiles vary by weapon type.");
          } else if (res.perkId === "thrusters.reverse-thrusters") {
            this.toastEvents.push("Reverse thrusters: in space, hold S/Down to brake.");
          } else if (res.perkId === "thrusters.strafing-thrusters") {
            this.toastEvents.push("Strafing: in space, hold Shift + A/D or Left/Right.");
          } else {
            this.toastEvents.push("Perk unlocked!");
          }
        }
      },
    );
    perkSystem.run();
  }

  requestSellPerk(perkId: PerkId): void {
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    this.perkSellRequests.push({ entityId: players[0].entity, perkId });
  }

  // Run only the perk sell system once (useful while UI is paused)
  applyPendingPerkSells(): void {
    const sellSystem = createPerkSellSystem(
      this.world,
      this.perkSellRequests,
      perkDefinitions,
      (res) => {
        if (res.success) this.toastEvents.push("Perk sold. Refunded perk points.");
      },
    );
    sellSystem.run();
  }

  // Debug/cheat helper: grant perk points to player
  grantPerkPoints(amount: number): void {
    if (amount <= 0) return;
    const players = this.world.query({ player: Components.Player });
    if (players.length === 0) return;
    const ent = new Entity(players[0].entity, this.world);
    const perk = ent.getComponent(Components.PlayerPerkPoints);
    if (perk) {
      perk.unspent += amount;
    } else {
      ent.addComponent(Components.PlayerPerkPoints, { unspent: amount });
    }
    this.toastEvents.push(`Granted ${amount} perk points.`);
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

  // Attract resources toward player and promote to items when within pickup radius
  private attractAndPromoteNearbyResources(dt: number): void {
    if (!this.planetSurface) return;
    const players = this.world.query({ position: Components.Position, player: Components.Player });
    if (players.length === 0) return;
    const playerPos = players[0].components.position;
    const ATTRACTION_RADIUS = 140;
    const PICKUP_RADIUS = 30;
    const MAX_PULL_SPEED = 260;
    const resources = this.planetSurface.resources;
    for (let i = resources.length - 1; i >= 0; i--) {
      const res = resources[i];
      const dx = playerPos.x - res.x;
      const dy = playerPos.y - res.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= PICKUP_RADIUS) {
        const { item, quantity } = this.createItemFromResource(res.type, res.amount);
        this.world
          .createEntity()
          .addComponent(Components.Position, { x: res.x, y: res.y })
          .addComponent(Components.DroppedItem, { item, quantity, ageSeconds: 0 });
        // Remove from surface once promoted to item entity
        resources.splice(i, 1);
      } else if (dist <= ATTRACTION_RADIUS) {
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);
        const proximityFactor = Math.max(0, Math.min(1, 1 - dist / ATTRACTION_RADIUS));
        const speed = MAX_PULL_SPEED * proximityFactor;
        const step = speed * dt;
        res.x += nx * step;
        res.y += ny * step;
      }
    }
  }

  private createItemFromResource(
    type: PlanetSurface["resources"][number]["type"],
    amount: number,
  ): { item: Item; quantity: number } {
    const id = `item_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    if (type === "energy") {
      return {
        item: {
          id,
          type: "xp_energy",
          baseType: "consumable",
          name: "Energy Shard",
          description: "A shard of pure energy that grants experience on pickup.",
          properties: {
            weight: 0,
            volume: 0,
            stackable: true,
            maxStackSize: 9999,
            quality: "common",
            rarity: "common",
            tradeable: false,
            dropOnDeath: false,
          },
          stats: { value: amount },
          requirements: {},
          effects: [],
          metadata: {
            discoveredAt: Date.now(),
            icon: "/items/xp_pack_small.svg",
            category: "boosters",
          },
          implemented: false,
        },
        quantity: amount,
      } as const;
    }
    if (type === "organic") {
      return {
        item: {
          id,
          type: "organic_matter",
          baseType: "material",
          name: "Organic Matter",
          description: "Organic material useful for crafting.",
          properties: {
            weight: 0.2,
            volume: 0.3,
            stackable: true,
            maxStackSize: 50,
            quality: "common",
            rarity: "common",
            tradeable: true,
            dropOnDeath: false,
          },
          stats: { value: 2 },
          requirements: {},
          effects: [],
          metadata: {
            discoveredAt: Date.now(),
            icon: "/items/body_parts.svg",
            category: "materials",
          },
          implemented: false,
        },
        quantity: Math.max(1, Math.floor(amount / 10)),
      } as const;
    }
    return {
      item: {
        id,
        type: "metal_ore",
        baseType: "material",
        name: "Metal Ore",
        description: "Unrefined ore containing useful metals.",
        properties: {
          weight: 0.5,
          volume: 0.4,
          stackable: true,
          maxStackSize: 50,
          quality: "common",
          rarity: "common",
          tradeable: true,
          dropOnDeath: false,
        },
        stats: { value: 4 },
        requirements: {},
        effects: [],
        metadata: {
          discoveredAt: Date.now(),
          icon: "/items/placeholder.svg",
          category: "materials",
        },
        implemented: false,
      },
      quantity: Math.max(1, Math.floor(amount / 8)),
    } as const;
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
    if (this.mode === "planet" && this.landedPlanetId != null) {
      const players = this.world.query({
        position: Components.Position,
        player: Components.Player,
      });
      const surface = this.planetSurface;
      let nearLanding = false;
      if (surface != null && players.length > 0) {
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
    if (player == null) {
      this.notification = null;
      return;
    }
    const nearbyPlanetId = this.findNearbyPlanetId();
    this.notification = nearbyPlanetId != null ? `Press L to land on ${nearbyPlanetId}` : null;
  }

  private createSolarNeighborhood(): void {
    // Place a few very large stars, spaced farther apart to allow generous orbits
    const starDefs = [
      { id: "star_a", x: 4000, y: 0, r: 480, color: "#ffd27a" },
      { id: "star_b", x: 0, y: -4800, r: 600, color: "#ffbb55" },
      { id: "star_c", x: -4400, y: 3600, r: 420, color: "#ffe08a" },
    ];

    // Create stars first so we can compute safe orbit limits per system
    const createdStars: Array<{
      id: string;
      x: number;
      y: number;
      r: number;
      color: string;
      entityId: number;
    }> = [];

    for (const def of starDefs) {
      const starEnt = EntityFactories.createStar(
        this.world,
        def.id,
        def.x,
        def.y,
        def.r,
        def.color,
      );
      createdStars.push({
        id: def.id,
        x: def.x,
        y: def.y,
        r: def.r,
        color: def.color,
        entityId: this.getEntityId(starEnt),
      });
    }

    // Safety margin between solar systems' outermost orbits
    const INTER_SYSTEM_MARGIN = 300; // world units

    // Generate planets for each star with an orbit cap to avoid cross-system overlap
    for (const star of createdStars) {
      // Compute half of the minimum distance to any other star, minus a margin
      let minDist = Infinity;
      for (const other of createdStars) {
        if (other.id === star.id) continue;
        const dist = Math.hypot(other.x - star.x, other.y - star.y);
        if (dist < minDist) minDist = dist;
      }
      // If it's isolated or single, pick a large cap; otherwise half-distance minus margin
      const availableOrbitLimit = Number.isFinite(minDist)
        ? Math.max(0, 0.5 * minDist - INTER_SYSTEM_MARGIN)
        : star.r + 4000;

      // 2–5 planets per star, but we will stop if we hit the orbit cap
      const requestedCount = 2 + Math.floor(Math.random() * 4);

      // First orbit sits comfortably away from the star, but within the cap
      const MIN_GAP_FROM_STAR = 320; // keep away from surface glow
      const BASE_ORBIT_GAP = 500; // preferred starting gap
      const baseOrbit = Math.min(
        availableOrbitLimit,
        star.r + Math.max(MIN_GAP_FROM_STAR, BASE_ORBIT_GAP),
      );

      // If base orbit already exceeds the cap, skip planets for this star
      if (baseOrbit <= star.r + MIN_GAP_FROM_STAR) continue;

      // Subsequent orbits space out moderately
      let placed = 0;
      let nextOrbit = baseOrbit;
      while (placed < requestedCount && nextOrbit <= availableOrbitLimit) {
        const orbitRadius = nextOrbit;
        const speed = (0.2 + Math.random() * 0.25) * (Math.random() < 0.5 ? 1 : -1);
        const angle = Math.random() * Math.PI * 2;
        const radius = 40 + Math.random() * 60;
        const colors = [
          "#4a90e2",
          "#e2a04a",
          "#4ae264",
          "#e24a90",
          "#9c4ae2",
          "#a7d3ff",
          "#ffd1a7",
        ];
        const designs: Array<"solid" | "ringed" | "striped" | "spotted"> = [
          "solid",
          "ringed",
          "striped",
          "spotted",
        ];
        EntityFactories.createOrbitingPlanet(this.world, {
          id: `${star.id}_p${placed + 1}`,
          color: colors[Math.floor(Math.random() * colors.length)],
          design: designs[Math.floor(Math.random() * designs.length)],
          radius,
          centerId: star.entityId,
          orbitRadius,
          orbitSpeed: speed,
          angle,
        });
        placed += 1;

        // Advance to next orbit with spacing, but don't overshoot available limit unnecessarily
        const spacing = 220 + Math.random() * 260;
        nextOrbit = orbitRadius + spacing;
      }
    }
  }

  private applyGravity(dt: number): void {
    // Reset influence flag; will be set if a planet affects the player this frame
    this.underPlanetGravity = false;

    // Collect gravitating bodies (planets + stars)
    const bodies: Array<{
      x: number;
      y: number;
      r: number;
      density: number;
      kind: "planet" | "star";
    }> = [];
    const planetEntities = this.world.query({
      position: Components.Position,
      collider: Components.Collider,
      planet: Components.Planet,
    });
    for (const planetEntity of planetEntities) {
      bodies.push({
        x: planetEntity.components.position.x,
        y: planetEntity.components.position.y,
        r: planetEntity.components.collider.radius,
        density: 0.1, // planets are ~4x star density
        kind: "planet",
      });
    }
    const starEntities = this.world.query({
      position: Components.Position,
      collider: Components.Collider,
      star: Components.Star,
    });
    for (const starEntity of starEntities) {
      bodies.push({
        x: starEntity.components.position.x,
        y: starEntity.components.position.y,
        r: starEntity.components.collider.radius,
        density: 0.025,
        kind: "star",
      });
    }
    if (bodies.length === 0) return;

    // Targets: player and enemy ships (space mode). Planet creatures exist only in planet mode.
    const playerTargets = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      player: Components.Player,
    });
    const enemyTargets = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      enemy: Components.Enemy,
    });
    if (playerTargets.length === 0 && enemyTargets.length === 0) return;

    // Apply to player first to preserve underPlanetGravity flag for drag override
    if (playerTargets.length > 0) {
      const { position, velocity } = playerTargets[0].components;
      const res = applyGravityTo(position, velocity, bodies, dt, { assistPlanets: true });
      if (res.influencedByPlanet) this.underPlanetGravity = true;
    }

    // Apply to all enemies
    for (const ent of enemyTargets) {
      const { position, velocity } = ent.components;
      applyGravityTo(position, velocity, bodies, dt, { assistPlanets: true });
    }
  }

  private applyStarHazard(dt: number): void {
    // Only active in space mode
    if (this.mode !== "space") {
      this.starHeat = null;
      this.enemyStarHeatOverlays = [];
      return;
    }

    // Gather stars once
    const stars = this.world.query({
      position: Components.Position,
      collider: Components.Collider,
      star: Components.Star,
    });
    if (stars.length === 0) {
      this.starHeat = null;
      this.enemyStarHeatOverlays = [];
      return;
    }

    // Helper to find nearest star to a position
    const findNearest = (
      x: number,
      y: number,
    ): { dx: number; dy: number; dist: number; radius: number } | null => {
      let nearest: { dx: number; dy: number; dist: number; radius: number } | null = null;
      for (const star of stars) {
        const sx = star.components.position.x;
        const sy = star.components.position.y;
        const starRadius = star.components.collider.radius;
        const dx = sx - x;
        const dy = sy - y;
        const dist = Math.hypot(dx, dy);
        if (!nearest || dist < nearest.dist) nearest = { dx, dy, dist, radius: starRadius };
      }
      return nearest;
    };

    // Player heat overlay + damage
    const players = this.world.query({
      position: Components.Position,
      velocity: Components.Velocity,
      health: Components.Health,
      player: Components.Player,
    });
    if (players.length > 0) {
      const playerPos = players[0].components.position;
      const playerHealth = players[0].components.health;
      const nearest = findNearest(playerPos.x, playerPos.y);
      if (!nearest) {
        this.starHeat = null;
      } else {
        const dist = nearest.dist;
        const starRadius = nearest.radius;
        const killRadius = starRadius * 0.75;
        const heatOuter = starRadius * 1.25;
        const surface = starRadius; // visual surface reference

        if (dist <= killRadius) {
          playerHealth.current = 0;
          this.starHeat = null;
        } else if (dist <= heatOuter) {
          const angle = Math.atan2(-nearest.dy, -nearest.dx);
          const span = Math.max(0.0001, heatOuter - surface);
          const intensity = Math.max(0, Math.min(1, (heatOuter - dist) / span));
          this.starHeat = { angle, intensity };
          const baseDps = 6;
          const scaledDps = baseDps * (0.2 + 1.0 * intensity);
          playerHealth.current = Math.max(0, playerHealth.current - scaledDps * dt);
        } else {
          this.starHeat = null;
        }
      }
    }

    // Enemy damage + overlay export for renderer parity with player
    this.enemyStarHeatOverlays = [];
    const enemies = this.world.query({
      position: Components.Position,
      health: Components.Health,
      enemy: Components.Enemy,
    });
    for (const enemy of enemies) {
      const pos = enemy.components.position;
      const hp = enemy.components.health;
      const id = enemy.components.enemy.id;
      const nearest = findNearest(pos.x, pos.y);
      if (!nearest) continue;
      const dist = nearest.dist;
      const starRadius = nearest.radius;
      const killRadius = starRadius * 0.75;
      const heatOuter = starRadius * 1.25;
      const surface = starRadius;

      let died = false;
      let overlay: { angle: number; intensity: number } | null = null;
      if (dist <= killRadius) {
        hp.current = 0;
        died = true;
      } else if (dist <= heatOuter) {
        const span = Math.max(0.0001, heatOuter - surface);
        const intensity = Math.max(0, Math.min(1, (heatOuter - dist) / span));
        overlay = { angle: Math.atan2(-nearest.dy, -nearest.dx), intensity };
        const baseDps = 6;
        const scaledDps = baseDps * (0.2 + 1.0 * intensity);
        hp.current = Math.max(0, hp.current - scaledDps * dt);
        died = hp.current <= 0;
      }

      if (!died && overlay && overlay.intensity > 0) {
        this.enemyStarHeatOverlays.push({ id, angle: overlay.angle, intensity: overlay.intensity });
      }

      if (died) {
        // Emit an impact event so SFX can react
        this.world
          .createEntity()
          .addComponent(Components.Position, { x: pos.x, y: pos.y })
          .addComponent(Components.ImpactEvent, { kind: "generic" });
        // Emit a visual burn FX event for the renderer
        this.renderFxEvents.push({ type: "burn", x: pos.x, y: pos.y });
        // Remove the enemy entity immediately (no drops in star hazard)
        this.world.removeEntity(enemy.entity);
      }
    }
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

  // Legacy resource collection removed: resources are promoted to items and handled by pickup system

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
    this.cameraVx = 0;
    this.cameraVy = 0;
    this.lookaheadX = 0;
    this.lookaheadY = 0;
  }

  getModeSnapshot(): { mode: "space" | "planet"; planetId?: string } {
    return { mode: this.mode, planetId: this.landedPlanetId ?? undefined };
  }

  restoreMode(data: { mode: "space" | "planet"; planetId?: string }): void {
    if (data.mode === "planet") {
      this.mode = "planet";
      this.landedPlanetId = data.planetId ?? null;
      if (this.landedPlanetId != null) {
        const planet = this.getPlanets().find((pl) => pl.id === this.landedPlanetId);
        if (planet != null)
          this.planetSurface = generatePlanetSurfaceFor({ id: planet.id, radius: planet.radius });
      }
    } else {
      this.mode = "space";
      this.landedPlanetId = null;
      this.planetSurface = undefined;
    }
    this.updateNotifications();
  }

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
