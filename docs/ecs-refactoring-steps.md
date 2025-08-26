# ECS Refactoring Steps - Detailed Implementation Guide

This document provides step-by-step instructions for refactoring L.O.S.E. to use the ECS architecture, with specific code examples and implementation details.

## Prerequisites

✅ ECS library created in `lib/ecs/`
✅ Migration guide reviewed (`docs/ecs-migration-guide.md`)  
✅ Component mapping understood (`docs/ecs-component-mapping.md`)

## Phase 1: Setup and Preparation

### Step 1.1: Install ECS Library

```bash
# Install the local ECS package
npm install ./lib/ecs
```

Add to `package.json` dependencies:

```json
{
  "dependencies": {
    "@lose-game/ecs": "file:./lib/ecs"
  }
}
```

### Step 1.2: Create ECS Directory Structure

```bash
mkdir -p src/domain/ecs/{components,systems,entities}
```

### Step 1.3: Create Base Components File

**File: `src/domain/ecs/components/index.ts`**

```typescript
import { defineComponent } from "@lose-game/ecs";

// Transform components
export const Position = defineComponent<{ x: number; y: number }>();
export const Velocity = defineComponent<{ dx: number; dy: number }>();
export const Rotation = defineComponent<{ angle: number }>();

// Physics components
export const Collider = defineComponent<{ radius: number }>();
export const RigidBody = defineComponent<{ mass: number }>();

// Entity type tags
export const Player = defineComponent<{}>(() => ({}));
export const Enemy = defineComponent<{ id: string }>();
export const Planet = defineComponent<{ id: string }>();
export const Projectile = defineComponent<{}>(() => ({}));

// Game mechanics
export const Health = defineComponent<{ current: number; max: number }>();
export const Damage = defineComponent<{ amount: number }>();
export const TimeToLive = defineComponent<{ remaining: number; initial: number }>();

// AI components
export const AIVision = defineComponent<{
  radius: number;
  hysteresis: number;
  hasTarget: boolean;
  targetId?: number;
}>();

export const AIMovement = defineComponent<{
  turnSpeed: number;
  accel: number;
  maxSpeed: number;
}>();

export const AIState = defineComponent<{
  currentState: "idle" | "pursuing" | "attacking" | "fleeing";
  stateTime: number;
}>();

// Visual components
export const Sprite = defineComponent<{
  color: string;
  design?: "solid" | "ringed" | "striped" | "spotted";
  scale?: number;
  opacity?: number;
}>();

export const Trail = defineComponent<{
  points: Array<{ x: number; y: number; age: number }>;
  maxLength: number;
  fadeTime: number;
}>();

// Player-specific
export const PlayerInventory = defineComponent<{
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: any[];
}>();

export const PlayerExperience = defineComponent<{
  current: number;
  level: number;
  toNextLevel: number;
}>();

// Game modes
export const SpaceMode = defineComponent<{}>(() => ({}));
export const PlanetMode = defineComponent<{
  planetId: string;
  surfacePosition: { x: number; y: number };
}>();
```

## Phase 2: Core Systems Implementation

### Step 2.1: Movement Systems

**File: `src/domain/ecs/systems/MovementSystem.ts`**

```typescript
import { defineSystem } from "@lose-game/ecs";
import type { World } from "@lose-game/ecs";
import { Position, Velocity, Rotation } from "../components";

export function createMovementSystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents(Position, Velocity)
    .execute((entities) => {
      entities.forEach(({ components: { Position, Velocity } }) => {
        Position.x += Velocity.dx * dt;
        Position.y += Velocity.dy * dt;
      });
    });
}
```

**File: `src/domain/ecs/systems/PlayerControlSystem.ts`**

```typescript
import { defineSystem } from "@lose-game/ecs";
import type { World } from "@lose-game/ecs";
import { Position, Velocity, Rotation, Player } from "../components";

export function createPlayerControlSystem(world: World, actions: Set<string>, dt: number) {
  const ACCELERATION = 200;
  const MAX_SPEED = 150;
  const TURN_SPEED = 3;

  return defineSystem(world)
    .withComponents(Position, Velocity, Rotation, Player)
    .execute((entities) => {
      entities.forEach(({ components: { Position, Velocity, Rotation } }) => {
        // Handle rotation
        if (actions.has("ArrowLeft") || actions.has("KeyA")) {
          Rotation.angle -= TURN_SPEED * dt;
        }
        if (actions.has("ArrowRight") || actions.has("KeyD")) {
          Rotation.angle += TURN_SPEED * dt;
        }

        // Handle thrust
        if (actions.has("ArrowUp") || actions.has("KeyW")) {
          const thrustX = Math.cos(Rotation.angle) * ACCELERATION * dt;
          const thrustY = Math.sin(Rotation.angle) * ACCELERATION * dt;

          Velocity.dx += thrustX;
          Velocity.dy += thrustY;

          // Limit max speed
          const speed = Math.sqrt(Velocity.dx * Velocity.dx + Velocity.dy * Velocity.dy);
          if (speed > MAX_SPEED) {
            Velocity.dx = (Velocity.dx / speed) * MAX_SPEED;
            Velocity.dy = (Velocity.dy / speed) * MAX_SPEED;
          }
        }

        // Apply drag
        const DRAG = 0.98;
        Velocity.dx *= DRAG;
        Velocity.dy *= DRAG;
      });
    });
}
```

### Step 2.2: AI System

**File: `src/domain/ecs/systems/EnemyAISystem.ts`**

```typescript
import { defineSystem } from "@lose-game/ecs";
import type { World } from "@lose-game/ecs";
import {
  Position,
  Velocity,
  Rotation,
  AIVision,
  AIMovement,
  AIState,
  Enemy,
  Player,
} from "../components";

export function createEnemyAISystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents(Position, Velocity, Rotation, AIVision, AIMovement, AIState, Enemy)
    .execute((entities) => {
      // Get player position
      const playerEntities = world.query(Position, Player);
      if (playerEntities.length === 0) return;

      const playerPos = playerEntities[0].components.Position;

      entities.forEach(
        ({ components: { Position, Velocity, Rotation, AIVision, AIMovement, AIState } }) => {
          // Calculate distance to player
          const dx = playerPos.x - Position.x;
          const dy = playerPos.y - Position.y;
          const distanceSquared = dx * dx + dy * dy;
          const distance = Math.sqrt(distanceSquared);

          // Update AI state based on distance
          const wasTargeting = AIVision.hasTarget;
          const visionRadiusAdjusted = wasTargeting
            ? AIVision.radius + AIVision.hysteresis
            : AIVision.radius - AIVision.hysteresis;

          AIVision.hasTarget = distance <= visionRadiusAdjusted;

          if (AIVision.hasTarget) {
            AIState.currentState = "pursuing";

            // Move toward player
            if (distance > 0) {
              const targetAngle = Math.atan2(dy, dx);

              // Turn toward target
              let angleDiff = targetAngle - Rotation.angle;
              while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
              while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

              const turnAmount =
                Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), AIMovement.turnSpeed * dt);
              Rotation.angle += turnAmount;

              // Apply thrust
              const thrustX = Math.cos(Rotation.angle) * AIMovement.accel * dt;
              const thrustY = Math.sin(Rotation.angle) * AIMovement.accel * dt;

              Velocity.dx += thrustX;
              Velocity.dy += thrustY;

              // Limit speed
              const speed = Math.sqrt(Velocity.dx * Velocity.dx + Velocity.dy * Velocity.dy);
              if (speed > AIMovement.maxSpeed) {
                Velocity.dx = (Velocity.dx / speed) * AIMovement.maxSpeed;
                Velocity.dy = (Velocity.dy / speed) * AIMovement.maxSpeed;
              }
            }
          } else {
            AIState.currentState = "idle";
            // Apply drag when not pursuing
            Velocity.dx *= 0.95;
            Velocity.dy *= 0.95;
          }

          AIState.stateTime += dt;
        },
      );
    });
}
```

### Step 2.3: Combat Systems

**File: `src/domain/ecs/systems/ProjectileSystem.ts`**

```typescript
import { defineSystem } from "@lose-game/ecs";
import type { World } from "@lose-game/ecs";
import { Position, Velocity, TimeToLive, Projectile } from "../components";

export function createProjectileSystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents(Position, Velocity, TimeToLive, Projectile)
    .execute((entities) => {
      entities.forEach(({ entity, components: { TimeToLive } }) => {
        TimeToLive.remaining -= dt;

        if (TimeToLive.remaining <= 0) {
          world.removeEntity(entity);
        }
      });
    });
}
```

**File: `src/domain/ecs/systems/CollisionSystem.ts`**

```typescript
import { defineSystem } from "@lose-game/ecs";
import type { World } from "@lose-game/ecs";
import { Position, Collider, Health, Damage, Projectile, Player, Enemy } from "../components";

export function createCollisionSystem(world: World) {
  return defineSystem(world)
    .withComponents(Position, Collider)
    .withOptionalComponents(Health, Damage, Projectile, Player, Enemy)
    .execute((entities) => {
      // Check projectile collisions
      const projectiles = entities.filter((e) => e.components.Projectile !== undefined);
      const targets = entities.filter(
        (e) =>
          (e.components.Player !== undefined || e.components.Enemy !== undefined) &&
          e.components.Health !== undefined,
      );

      projectiles.forEach((projectile) => {
        targets.forEach((target) => {
          if (projectile.entity === target.entity) return; // Can't hit self

          const dx = projectile.components.Position.x - target.components.Position.x;
          const dy = projectile.components.Position.y - target.components.Position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const combinedRadius =
            projectile.components.Collider.radius + target.components.Collider.radius;

          if (distance < combinedRadius) {
            // Hit!
            if (target.components.Health && projectile.components.Damage) {
              target.components.Health.current -= projectile.components.Damage.amount;

              if (target.components.Health.current <= 0) {
                world.removeEntity(target.entity);
              }
            }

            world.removeEntity(projectile.entity);
          }
        });
      });
    });
}
```

## Phase 3: ECS GameSession Implementation

### Step 3.1: Entity Creation Helpers

**File: `src/domain/ecs/entities/EntityFactories.ts`**

```typescript
import type { World } from "@lose-game/ecs";
import type { Player as OldPlayer } from "../../game/player";
import type { Enemy as OldEnemy } from "../../game/enemies";
import type { Planet as OldPlanet } from "../../game/planets";
import type { Projectile as OldProjectile } from "../../game/projectiles";
import * as Components from "../components";

export function createPlayerEntity(world: World, player: OldPlayer) {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: player.state.x, y: player.state.y })
    .addComponent(Components.Velocity, { dx: player.state.vx, dy: player.state.vy })
    .addComponent(Components.Rotation, { angle: player.state.angle })
    .addComponent(Components.Health, {
      current: player.state.health || 100,
      max: 100,
    })
    .addComponent(Components.Player)
    .addComponent(Components.PlayerInventory, {
      slots: 20,
      maxWeight: 100,
      currentWeight: player.inventory.getCurrentWeight(),
      items: player.inventory.getItems(),
    })
    .addComponent(Components.PlayerExperience, {
      current: player.state.experience || 0,
      level: 1,
      toNextLevel: 100,
    })
    .addComponent(Components.Collider, { radius: 16 })
    .addComponent(Components.Sprite, { color: "#00ff00", scale: 1.0 })
    .addComponent(Components.SpaceMode);
}

export function createEnemyEntity(world: World, enemy: OldEnemy) {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: enemy.x, y: enemy.y })
    .addComponent(Components.Velocity, { dx: enemy.vx, dy: enemy.vy })
    .addComponent(Components.Rotation, { angle: enemy.angle })
    .addComponent(Components.Health, { current: enemy.health, max: enemy.health })
    .addComponent(Components.Enemy, { id: enemy.id })
    .addComponent(Components.AIVision, {
      radius: enemy.visionRadius,
      hysteresis: enemy.visionHysteresis,
      hasTarget: false,
    })
    .addComponent(Components.AIMovement, {
      turnSpeed: enemy.turnSpeed,
      accel: enemy.accel,
      maxSpeed: enemy.maxSpeed,
    })
    .addComponent(Components.AIState, {
      currentState: "idle",
      stateTime: 0,
    })
    .addComponent(Components.Collider, { radius: enemy.radius })
    .addComponent(Components.Sprite, { color: "#ff0000", scale: 1.0 })
    .addComponent(Components.SpaceMode);
}

export function createPlanetEntity(world: World, planet: OldPlanet) {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: planet.x, y: planet.y })
    .addComponent(Components.Collider, { radius: planet.radius })
    .addComponent(Components.Planet, { id: planet.id })
    .addComponent(Components.Sprite, {
      color: planet.color,
      design: planet.design,
      scale: 1.0,
    })
    .addComponent(Components.SpaceMode);
}

export function createProjectileEntity(world: World, projectile: OldProjectile, damage = 25) {
  return world
    .createEntity()
    .addComponent(Components.Position, { x: projectile.x, y: projectile.y })
    .addComponent(Components.Velocity, { dx: projectile.vx, dy: projectile.vy })
    .addComponent(Components.Projectile)
    .addComponent(Components.TimeToLive, {
      remaining: projectile.ttl,
      initial: projectile.ttl,
    })
    .addComponent(Components.Damage, { amount: damage })
    .addComponent(Components.Collider, { radius: projectile.radius })
    .addComponent(Components.Sprite, { color: "#ffff00", scale: 0.5 })
    .addComponent(Components.SpaceMode);
}
```

### Step 3.2: ECS GameSession

**File: `src/domain/ecs/GameSessionECS.ts`**

```typescript
import { World } from "@lose-game/ecs";
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

export class GameSessionECS {
  private world = new World();
  private playerEntityId: number | null = null;

  // Camera (keep as is for now)
  camera: { x: number; y: number; zoom: number };
  size: { width: number; height: number };
  notification: string | null = null;

  constructor(config: {
    camera: { x: number; y: number; zoom: number };
    player: Player;
    planets: Planet[];
    size: { width: number; height: number };
    enemies?: Enemy[];
  }) {
    this.camera = config.camera;
    this.size = config.size;

    this.createInitialEntities(config);
  }

  private createInitialEntities(config: { player: Player; planets: Planet[]; enemies?: Enemy[] }) {
    // Create player
    const playerEntity = EntityFactories.createPlayerEntity(this.world, config.player);
    this.playerEntityId = playerEntity.id;

    // Create planets
    config.planets.forEach((planet) => {
      EntityFactories.createPlanetEntity(this.world, planet);
    });

    // Create enemies
    if (config.enemies) {
      config.enemies.forEach((enemy) => {
        EntityFactories.createEnemyEntity(this.world, enemy);
      });
    }
  }

  update(actions: Set<string>, dt: number) {
    // Create and run systems
    const movementSystem = createMovementSystem(this.world, dt);
    const playerControlSystem = createPlayerControlSystem(this.world, actions, dt);
    const enemyAISystem = createEnemyAISystem(this.world, dt);
    const projectileSystem = createProjectileSystem(this.world, dt);
    const collisionSystem = createCollisionSystem(this.world);

    // Run systems in order
    playerControlSystem.run();
    enemyAISystem.run();
    movementSystem.run();
    projectileSystem.run();
    collisionSystem.run();

    // Update camera to follow player
    this.updateCameraFollowPlayer();
  }

  private updateCameraFollowPlayer() {
    if (!this.playerEntityId) return;

    const playerEntities = this.world.query(Components.Position, Components.Player);
    if (playerEntities.length > 0) {
      const playerPos = playerEntities[0].components.Position;
      this.camera.x = playerPos.x;
      this.camera.y = playerPos.y;
    }
  }

  // Public query methods for UI/rendering
  getPlayer() {
    const players = this.world.query(
      Components.Position,
      Components.Velocity,
      Components.Rotation,
      Components.Health,
      Components.Player,
    );
    if (players.length === 0) return null;

    const player = players[0];
    return {
      x: player.components.Position.x,
      y: player.components.Position.y,
      vx: player.components.Velocity.dx,
      vy: player.components.Velocity.dy,
      angle: player.components.Rotation.angle,
      health: player.components.Health.current,
    };
  }

  getEnemies() {
    return this.world
      .query(
        Components.Position,
        Components.Velocity,
        Components.Rotation,
        Components.Health,
        Components.Enemy,
      )
      .map((enemy) => ({
        id: enemy.components.Enemy.id,
        x: enemy.components.Position.x,
        y: enemy.components.Position.y,
        vx: enemy.components.Velocity.dx,
        vy: enemy.components.Velocity.dy,
        angle: enemy.components.Rotation.angle,
        health: enemy.components.Health.current,
        radius: 14, // Default for now
      }));
  }

  getPlanets() {
    return this.world
      .query(Components.Position, Components.Collider, Components.Sprite, Components.Planet)
      .map((planet) => ({
        id: planet.components.Planet.id,
        x: planet.components.Position.x,
        y: planet.components.Position.y,
        radius: planet.components.Collider.radius,
        color: planet.components.Sprite.color,
        design: planet.components.Sprite.design || "solid",
      }));
  }

  getProjectiles() {
    return this.world
      .query(Components.Position, Components.Collider, Components.Projectile)
      .map((proj) => ({
        x: proj.components.Position.x,
        y: proj.components.Position.y,
        radius: proj.components.Collider.radius,
      }));
  }

  // Weapon firing
  fireProjectile() {
    const playerEntities = this.world.query(
      Components.Position,
      Components.Rotation,
      Components.Player,
    );
    if (playerEntities.length === 0) return;

    const player = playerEntities[0];
    const playerPos = player.components.Position;
    const playerRot = player.components.Rotation;

    // Create projectile
    const speed = 600;
    const dirX = Math.cos(playerRot.angle);
    const dirY = Math.sin(playerRot.angle);

    this.world
      .createEntity()
      .addComponent(Components.Position, {
        x: playerPos.x + dirX * 28,
        y: playerPos.y + dirY * 28,
      })
      .addComponent(Components.Velocity, {
        dx: dirX * speed,
        dy: dirY * speed,
      })
      .addComponent(Components.Projectile)
      .addComponent(Components.TimeToLive, { remaining: 1.5, initial: 1.5 })
      .addComponent(Components.Damage, { amount: 25 })
      .addComponent(Components.Collider, { radius: 2 })
      .addComponent(Components.Sprite, { color: "#ffff00", scale: 0.5 });
  }

  // Mode management (simplified for now)
  getCurrentModeType(): "space" | "planet" {
    return "space"; // Always space mode for initial implementation
  }
}
```

## Phase 4: Integration Testing

### Step 4.1: Create Feature Flag

**File: `src/domain/game/GameSession.ts` (modify existing)**

```typescript
// Add at top of file
const USE_ECS =
  process.env.NODE_ENV === "development" && (globalThis as any).__LOSE_USE_ECS === true;

// Export for external toggling
export const setECSEnabled = (enabled: boolean) => {
  (globalThis as any).__LOSE_USE_ECS = enabled;
};
```

### Step 4.2: Create Test Setup

**File: `src/domain/ecs/__tests__/GameSessionECS.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { GameSessionECS } from "../GameSessionECS";
import { Player } from "../../game/player";
import type { Planet } from "../../game/planets";

describe("GameSessionECS", () => {
  it("should create and update basic game state", () => {
    const player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const planets: Planet[] = [];

    const gameSession = new GameSessionECS({
      camera: { x: 0, y: 0, zoom: 1 },
      player,
      planets,
      size: { width: 800, height: 600 },
    });

    const initialPlayer = gameSession.getPlayer();
    expect(initialPlayer).toBeTruthy();
    expect(initialPlayer!.x).toBe(0);
    expect(initialPlayer!.y).toBe(0);

    // Test update
    const actions = new Set(["ArrowUp"]);
    gameSession.update(actions, 0.016); // 60 FPS

    const updatedPlayer = gameSession.getPlayer();
    expect(updatedPlayer!.vx).toBeGreaterThan(0); // Should have thrust
  });

  it("should handle projectile firing", () => {
    const player = new Player({ x: 100, y: 100, vx: 0, vy: 0, angle: 0 });
    const planets: Planet[] = [];

    const gameSession = new GameSessionECS({
      camera: { x: 0, y: 0, zoom: 1 },
      player,
      planets,
      size: { width: 800, height: 600 },
    });

    expect(gameSession.getProjectiles()).toHaveLength(0);

    gameSession.fireProjectile();

    const projectiles = gameSession.getProjectiles();
    expect(projectiles).toHaveLength(1);
    expect(projectiles[0].x).toBeGreaterThan(100); // Should spawn ahead of player
  });
});
```

### Step 4.3: Run Tests

```bash
npm test -- src/domain/ecs
```

## Phase 5: UI Integration

### Step 5.1: Modify CanvasRenderer

**File: `src/ui/components/CanvasRenderer.tsx` (modify existing)**

```typescript
// Add ECS import
import { GameSessionECS } from "../../domain/ecs/GameSessionECS";

// Add feature flag check in render loop
const USE_ECS = (globalThis as any).__LOSE_USE_ECS === true;

// Modify the main game loop to support both systems
if (USE_ECS && gameSessionECSRef.current) {
  gameSessionECSRef.current.update(actions, dt);

  // Get data from ECS for rendering
  const player = gameSessionECSRef.current.getPlayer();
  const enemies = gameSessionECSRef.current.getEnemies();
  const planets = gameSessionECSRef.current.getPlanets();
  const projectiles = gameSessionECSRef.current.getProjectiles();

  // Render using existing GameRenderer
  gameRenderer.render(
    ctx,
    player,
    gameSessionECSRef.current.camera,
    planets,
    projectiles,
    enemies,
    actions,
    size,
    dpr,
    null, // No gameSession for ECS mode
  );
} else {
  // Use existing OOP system
  gameSession.update(actions, updatePlayer, maybeGenerateRegion, dt);
  // ... existing rendering code
}
```

## Phase 6: Performance Testing

### Step 6.1: Create Benchmark

**File: `src/domain/ecs/__tests__/performance.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { GameSessionECS } from "../GameSessionECS";
import { GameSession } from "../../game/GameSession";
import { Player } from "../../game/player";
import { createEnemy } from "../../game/enemies";

describe("ECS Performance", () => {
  it("should handle many entities efficiently", () => {
    const player = new Player({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
    const enemies = Array.from({ length: 1000 }, (_, i) =>
      createEnemy(`enemy_${i}`, Math.random() * 1000, Math.random() * 1000),
    );

    const ecsSession = new GameSessionECS({
      camera: { x: 0, y: 0, zoom: 1 },
      player,
      planets: [],
      enemies,
      size: { width: 800, height: 600 },
    });

    const startTime = performance.now();

    // Run 60 frames
    for (let i = 0; i < 60; i++) {
      ecsSession.update(new Set(), 0.016);
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`ECS: 1000 enemies, 60 frames: ${duration.toFixed(2)}ms`);
    expect(duration).toBeLessThan(1000); // Should complete in under 1 second
  });
});
```

### Step 6.2: Run Performance Tests

```bash
npm test -- src/domain/ecs/__tests__/performance.test.ts
```

## Phase 7: Migration Completion

### Step 7.1: Enable ECS by Default

```typescript
// In main game setup
(globalThis as any).__LOSE_USE_ECS = true;
```

### Step 7.2: Remove Old Code

After thorough testing:

1. Remove old `GameSession` class
2. Remove individual entity classes (`Player`, `Enemy`, etc.)
3. Update all imports to use ECS versions
4. Remove feature flag code

### Step 7.3: Update Documentation

Update `docs/code-map.md` and other docs to reflect ECS architecture.

## Troubleshooting

### Common Issues

1. **Component type errors**: Ensure components are properly imported and types match
2. **System execution order**: Some systems depend on others running first
3. **Entity lifecycle**: Make sure entities are properly created/destroyed
4. **Performance**: Use profiling tools to identify bottlenecks

### Debug Tools

Add debug console commands:

```typescript
// In browser console
(globalThis as any).__LOSE_DEBUG_ECS = {
  world: ecsGameSession.world,
  queryAll: () => ecsGameSession.world.query(),
  getEntities: () => Array.from(ecsGameSession.world.entities),
};
```

This comprehensive refactoring guide provides everything needed to successfully migrate L.O.S.E. from object-oriented to ECS architecture while maintaining all existing functionality.
