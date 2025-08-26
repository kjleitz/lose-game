# ECS Component Mapping Reference

This document provides a detailed mapping from the current L.O.S.E. game objects to ECS components, showing how to decompose existing classes into the component-based architecture.

## Current → ECS Mapping Overview

| Current Class | ECS Components                                                              | Notes                  |
| ------------- | --------------------------------------------------------------------------- | ---------------------- |
| `Player`      | Position, Velocity, Rotation, Health, Player, PlayerInventory, Collider     | Main player entity     |
| `Enemy`       | Position, Velocity, Rotation, Health, AIVision, AIMovement, Enemy, Collider | AI-controlled entities |
| `Planet`      | Position, Sprite, Collider, Planet                                          | Static world objects   |
| `Projectile`  | Position, Velocity, TimeToLive, Collider, Projectile, Damage                | Moving combat objects  |

## Detailed Component Breakdown

### Transform Components (Universal)

These components handle position, movement, and orientation:

```typescript
// Basic spatial components
const Position = defineComponent<{ x: number; y: number }>();
const Velocity = defineComponent<{ dx: number; dy: number }>();
const Rotation = defineComponent<{ angle: number }>();

// Physics components
const Collider = defineComponent<{ radius: number }>();
const RigidBody = defineComponent<{ mass: number }>();
```

**Mapping:**

- `Player.state.{x, y}` → `Position`
- `Player.state.{vx, vy}` → `Velocity`
- `Player.state.angle` → `Rotation`
- `Enemy.radius` → `Collider.radius`
- `Planet.radius` → `Collider.radius`
- `Projectile.radius` → `Collider.radius`

### Entity Type Components (Tags)

These components identify entity types:

```typescript
const Player = defineComponent<{}>(() => ({}));
const Enemy = defineComponent<{ id: string }>();
const Planet = defineComponent<{ id: string }>();
const Projectile = defineComponent<{}>(() => ({}));
```

**Mapping:**

- `Player` class → `Player` tag component
- `Enemy.id` → `Enemy.id`
- `Planet.id` → `Planet.id`
- `Projectile` → `Projectile` tag component

### Health & Combat Components

Handle health, damage, and combat mechanics:

```typescript
const Health = defineComponent<{ current: number; max: number }>();
const Damage = defineComponent<{ amount: number }>();
const ShieldHealth = defineComponent<{ current: number; max: number; rechargeRate: number }>();
```

**Mapping:**

- `Player.state.health` → `Health.current` (max: 100)
- `Enemy.health` → `Health.current` and `Health.max`
- No current damage system → Add `Damage` to projectiles

### AI Components

Handle enemy behavior and decision-making:

```typescript
const AIVision = defineComponent<{
  radius: number;
  hysteresis: number;
  hasTarget: boolean;
  targetId?: number;
}>();

const AIMovement = defineComponent<{
  turnSpeed: number;
  accel: number;
  maxSpeed: number;
}>();

const AIState = defineComponent<{
  currentState: "idle" | "pursuing" | "attacking" | "fleeing";
  stateTime: number;
}>();
```

**Mapping:**

- `Enemy.visionRadius` → `AIVision.radius`
- `Enemy.visionHysteresis` → `AIVision.hysteresis`
- `Enemy.turnSpeed` → `AIMovement.turnSpeed`
- `Enemy.accel` → `AIMovement.accel`
- `Enemy.maxSpeed` → `AIMovement.maxSpeed`

### Time-Based Components

Handle time-limited entities and effects:

```typescript
const TimeToLive = defineComponent<{
  remaining: number;
  initial: number;
}>();

const Cooldown = defineComponent<{
  remaining: number;
  duration: number;
}>();
```

**Mapping:**

- `Projectile.ttl` → `TimeToLive.remaining`
- No current cooldown system → Add for weapon firing

### Visual Components

Handle rendering and visual properties:

```typescript
const Sprite = defineComponent<{
  color: string;
  design?: "solid" | "ringed" | "striped" | "spotted";
  scale?: number;
  opacity?: number;
}>();

const Animation = defineComponent<{
  currentFrame: number;
  frameCount: number;
  frameRate: number;
  loop: boolean;
}>();

const Trail = defineComponent<{
  points: Array<{ x: number; y: number; age: number }>;
  maxLength: number;
  fadeTime: number;
}>();
```

**Mapping:**

- `Planet.color` → `Sprite.color`
- `Planet.design` → `Sprite.design`
- No current animation system → Add for effects
- No current trail system → Add for projectiles/ships

### Player-Specific Components

Handle player-only functionality:

```typescript
const PlayerInventory = defineComponent<{
  slots: number;
  maxWeight: number;
  currentWeight: number;
  items: any[]; // Use existing inventory system
}>();

const PlayerExperience = defineComponent<{
  current: number;
  level: number;
  toNextLevel: number;
}>();

const PlayerInput = defineComponent<{
  actions: Set<string>;
  lastInputTime: number;
}>();
```

**Mapping:**

- `Player.inventory` → `PlayerInventory` (keep existing `PlayerInventoryManager`)
- `Player.state.experience` → `PlayerExperience.current`
- No current input tracking → Add `PlayerInput` for replay systems

### Game Mode Components

Handle different game modes (space/planet):

```typescript
const SpaceMode = defineComponent<{}>(() => ({}));
const PlanetMode = defineComponent<{
  planetId: string;
  surfacePosition: { x: number; y: number };
}>();

const ModeTransition = defineComponent<{
  from: string;
  to: string;
  progress: number;
  duration: number;
}>();
```

**Mapping:**

- Current mode tracking in `GameSession` → Mode tag components
- No transition system → Add `ModeTransition` for smooth transitions

## Entity Composition Examples

### Player Entity

```typescript
world
  .createEntity()
  .addComponent(Position, { x: 100, y: 100 })
  .addComponent(Velocity, { dx: 0, dy: 0 })
  .addComponent(Rotation, { angle: 0 })
  .addComponent(Health, { current: 100, max: 100 })
  .addComponent(Collider, { radius: 16 })
  .addComponent(Player)
  .addComponent(PlayerInventory, {
    slots: 20,
    maxWeight: 100,
    currentWeight: 0,
    items: [],
  })
  .addComponent(PlayerExperience, {
    current: 0,
    level: 1,
    toNextLevel: 100,
  })
  .addComponent(Sprite, { color: "#00ff00", scale: 1.0 })
  .addComponent(SpaceMode);
```

### Enemy Entity

```typescript
world
  .createEntity()
  .addComponent(Position, { x: 200, y: 150 })
  .addComponent(Velocity, { dx: 0, dy: 0 })
  .addComponent(Rotation, { angle: 0 })
  .addComponent(Health, { current: 50, max: 50 })
  .addComponent(Collider, { radius: 14 })
  .addComponent(Enemy, { id: "enemy_001" })
  .addComponent(AIVision, {
    radius: 700,
    hysteresis: 80,
    hasTarget: false,
  })
  .addComponent(AIMovement, {
    turnSpeed: 1.8,
    accel: 100,
    maxSpeed: 80,
  })
  .addComponent(AIState, {
    currentState: "idle",
    stateTime: 0,
  })
  .addComponent(Sprite, { color: "#ff0000", scale: 1.0 });
```

### Planet Entity

```typescript
world
  .createEntity()
  .addComponent(Position, { x: 500, y: 300 })
  .addComponent(Collider, { radius: 60 })
  .addComponent(Planet, { id: "planet_terra" })
  .addComponent(Sprite, {
    color: "#4a90e2",
    design: "striped",
    scale: 1.0,
  })
  .addComponent(SpaceMode); // Only visible in space
```

### Projectile Entity

```typescript
world
  .createEntity()
  .addComponent(Position, { x: 120, y: 105 })
  .addComponent(Velocity, { dx: 300, dy: 50 })
  .addComponent(Collider, { radius: 2 })
  .addComponent(Projectile)
  .addComponent(TimeToLive, { remaining: 1.5, initial: 1.5 })
  .addComponent(Damage, { amount: 25 })
  .addComponent(Sprite, { color: "#ffff00", scale: 0.5 })
  .addComponent(Trail, {
    points: [],
    maxLength: 10,
    fadeTime: 0.5,
  });
```

## Migration Helper Functions

Create helper functions to ease the transition:

```typescript
// Convert existing objects to ECS entities
export function createPlayerEntity(world: World, player: Player): EntityId {
  return world
    .createEntity()
    .addComponent(Position, { x: player.state.x, y: player.state.y })
    .addComponent(Velocity, { dx: player.state.vx, dy: player.state.vy })
    .addComponent(Rotation, { angle: player.state.angle })
    .addComponent(Health, {
      current: player.state.health || 100,
      max: 100,
    })
    .addComponent(Player)
    .addComponent(PlayerInventory, {
      slots: 20,
      maxWeight: 100,
      currentWeight: player.inventory.getCurrentWeight(),
      items: player.inventory.getItems(),
    })
    .addComponent(Collider, { radius: 16 })
    .addComponent(Sprite, { color: "#00ff00", scale: 1.0 }).id;
}

export function createEnemyEntity(world: World, enemy: Enemy): EntityId {
  return world
    .createEntity()
    .addComponent(Position, { x: enemy.x, y: enemy.y })
    .addComponent(Velocity, { dx: enemy.vx, dy: enemy.vy })
    .addComponent(Rotation, { angle: enemy.angle })
    .addComponent(Health, { current: enemy.health, max: enemy.health })
    .addComponent(Enemy, { id: enemy.id })
    .addComponent(AIVision, {
      radius: enemy.visionRadius,
      hysteresis: enemy.visionHysteresis,
      hasTarget: false,
    })
    .addComponent(AIMovement, {
      turnSpeed: enemy.turnSpeed,
      accel: enemy.accel,
      maxSpeed: enemy.maxSpeed,
    })
    .addComponent(Collider, { radius: enemy.radius })
    .addComponent(Sprite, { color: "#ff0000", scale: 1.0 }).id;
}

export function createProjectileEntity(world: World, projectile: Projectile): EntityId {
  return world
    .createEntity()
    .addComponent(Position, { x: projectile.x, y: projectile.y })
    .addComponent(Velocity, { dx: projectile.vx, dy: projectile.vy })
    .addComponent(Projectile)
    .addComponent(TimeToLive, { remaining: projectile.ttl, initial: projectile.ttl })
    .addComponent(Damage, { amount: 25 })
    .addComponent(Collider, { radius: projectile.radius })
    .addComponent(Sprite, { color: "#ffff00", scale: 0.5 }).id;
}
```

## Component Lifecycle

Understanding when components are added/removed:

### Static Components (Never Change)

- `Player`, `Enemy`, `Planet`, `Projectile` (entity type tags)
- `Collider` (unless entity changes size)

### Dynamic Components (Can Be Added/Removed)

- `SpaceMode`/`PlanetMode` (when transitioning between modes)
- `AIState` (enemies might become inactive)
- `Trail` (projectiles might spawn/despawn trails)
- `Animation` (effects might start/stop animating)

### Evolving Components (Data Changes Frequently)

- `Position`, `Velocity`, `Rotation` (every frame)
- `Health` (during combat)
- `TimeToLive` (decreases each frame)
- `AIVision.hasTarget` (when acquiring/losing targets)

This mapping provides a clear path from the current L.O.S.E. architecture to a flexible, component-based system that maintains all existing functionality while enabling future enhancements.
