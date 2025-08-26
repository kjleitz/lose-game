# ECS Migration Guide

This guide outlines the migration path from the current object-oriented architecture to the new Entity Component System (ECS) in `lib/ecs/`.

## Current Architecture Analysis

### Existing Game Objects

The current L.O.S.E. game uses these main entities:

- **Player** (`src/domain/game/player.ts`) - Player state, position, velocity, health, inventory
- **Enemy** (`src/domain/game/enemies.ts`) - Enemy AI, position, health, vision
- **Planet** (`src/domain/game/planets.ts`) - Static world objects with position and visual properties
- **Projectile** (`src/domain/game/projectiles.ts`) - Moving objects with position, velocity, TTL
- **GameSession** (`src/domain/game/GameSession.ts`) - Central game state coordinator

### Current Data Flow

1. GameSession manages all game objects as arrays/collections
2. Update logic is scattered across individual object methods
3. Rendering handled by separate renderer classes in `src/domain/render/`
4. Game modes (space/planet) handled by mode classes

## ECS Migration Strategy

### Phase 1: Install ECS Library

```bash
# Install the ECS library as an internal package
npm install ./lib/ecs

# Add to package.json dependencies
"@lose-game/ecs": "file:./lib/ecs"
```

### Phase 2: Component Design

Map current game objects to ECS components:

#### Core Transform Components

```typescript
import { defineComponent } from "@lose-game/ecs";

// Position and movement
export const Position = defineComponent<{ x: number; y: number }>();
export const Velocity = defineComponent<{ dx: number; dy: number }>();
export const Rotation = defineComponent<{ angle: number }>();

// Physics
export const Collider = defineComponent<{ radius: number }>();
export const RigidBody = defineComponent<{ mass: number }>();
```

#### Entity Identification Components

```typescript
// Tags for entity types
export const Player = defineComponent<{}>(() => ({}));
export const Enemy = defineComponent<{ id: string }>();
export const Planet = defineComponent<{ id: string }>();
export const Projectile = defineComponent<{}>(() => ({}));
```

#### Game-Specific Components

```typescript
// Combat & Health
export const Health = defineComponent<{ current: number; max: number }>();
export const Damage = defineComponent<{ amount: number }>();

// AI & Behavior
export const AIVision = defineComponent<{
  radius: number;
  hysteresis: number;
  hasTarget: boolean;
}>();

export const AIMovement = defineComponent<{
  turnSpeed: number;
  accel: number;
  maxSpeed: number;
}>();

// Time-based
export const TimeToLive = defineComponent<{ remaining: number }>();

// Rendering
export const Sprite = defineComponent<{
  color: string;
  design?: "solid" | "ringed" | "striped" | "spotted";
}>();

// Player-specific
export const PlayerInventory = defineComponent<{
  slots: number;
  maxWeight: number;
  items: any[]; // Keep existing inventory system
}>();
```

### Phase 3: System Design

Create systems to replace current update logic:

#### Movement Systems

```typescript
export const MovementSystem = defineSystem(world)
  .withComponents(Position, Velocity)
  .execute((entities) => {
    entities.forEach(({ components: { Position, Velocity } }) => {
      Position.x += Velocity.dx;
      Position.y += Velocity.dy;
    });
  });

export const PlayerControlSystem = defineSystem(world)
  .withComponents(Position, Velocity, Player)
  .execute((entities) => {
    // Handle player input and movement
  });
```

#### AI Systems

```typescript
export const EnemyAISystem = defineSystem(world)
  .withComponents(Position, Velocity, AIVision, AIMovement, Enemy)
  .execute((entities) => {
    const playerEntities = world.query(Position, Player);
    // Implement enemy AI logic
  });
```

#### Combat Systems

```typescript
export const ProjectileSystem = defineSystem(world)
  .withComponents(Position, Velocity, TimeToLive, Projectile)
  .execute((entities) => {
    entities.forEach(({ entity, components: { TimeToLive } }) => {
      TimeToLive.remaining -= dt;
      if (TimeToLive.remaining <= 0) {
        world.removeEntity(entity);
      }
    });
  });

export const CollisionSystem = defineSystem(world)
  .withComponents(Position, Collider)
  .execute((entities) => {
    // Handle collisions between entities
  });
```

#### Rendering Systems

```typescript
export const RenderSystem = defineSystem(world)
  .withComponents(Position, Sprite)
  .withOptionalComponents(Rotation, Health)
  .execute((entities) => {
    entities.forEach(({ components: { Position, Sprite, Rotation, Health } }) => {
      // Render logic using existing renderer classes
    });
  });
```

### Phase 4: GameSession Refactor

Transform GameSession to use ECS World:

```typescript
import { World } from "@lose-game/ecs";
import * as Components from "./components";
import * as Systems from "./systems";

export class GameSessionECS {
  private world = new World();

  constructor(initialState: GameSessionState) {
    this.setupSystems();
    this.createInitialEntities(initialState);
  }

  private setupSystems() {
    this.world.addSystem(Systems.PlayerControlSystem);
    this.world.addSystem(Systems.MovementSystem);
    this.world.addSystem(Systems.EnemyAISystem);
    this.world.addSystem(Systems.ProjectileSystem);
    this.world.addSystem(Systems.CollisionSystem);
    // Rendering handled separately in UI layer
  }

  private createInitialEntities(state: GameSessionState) {
    // Create player entity
    this.world
      .createEntity()
      .addComponent(Components.Position, { x: state.player.x, y: state.player.y })
      .addComponent(Components.Velocity, { dx: state.player.vx, dy: state.player.vy })
      .addComponent(Components.Rotation, { angle: state.player.angle })
      .addComponent(Components.Health, {
        current: state.player.health || 100,
        max: 100,
      })
      .addComponent(Components.Player)
      .addComponent(Components.PlayerInventory, {
        slots: 20,
        maxWeight: 100,
        items: state.player.inventory?.getItems() || [],
      });

    // Create planets
    state.planets.forEach((planet) => {
      this.world
        .createEntity()
        .addComponent(Components.Position, { x: planet.x, y: planet.y })
        .addComponent(Components.Collider, { radius: planet.radius })
        .addComponent(Components.Sprite, {
          color: planet.color,
          design: planet.design,
        })
        .addComponent(Components.Planet, { id: planet.id });
    });

    // Create enemies
    state.enemies.forEach((enemy) => {
      this.world
        .createEntity()
        .addComponent(Components.Position, { x: enemy.x, y: enemy.y })
        .addComponent(Components.Velocity, { dx: enemy.vx, dy: enemy.vy })
        .addComponent(Components.Rotation, { angle: enemy.angle })
        .addComponent(Components.Health, { current: enemy.health, max: enemy.health })
        .addComponent(Components.Collider, { radius: enemy.radius })
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
        .addComponent(Components.Enemy, { id: enemy.id });
    });
  }

  update(actions: Set<string>, dt: number) {
    // Update all systems
    this.world.runSystems();
  }

  // Query methods for UI/rendering
  getPlayer() {
    const players = this.world.query(Components.Position, Components.Player, Components.Health);
    return players[0] || null;
  }

  getEnemies() {
    return this.world.query(Components.Position, Components.Enemy, Components.Health);
  }

  getPlanets() {
    return this.world.query(Components.Position, Components.Planet, Components.Sprite);
  }

  getProjectiles() {
    return this.world.query(Components.Position, Components.Projectile, Components.Collider);
  }
}
```

## Step-by-Step Migration Process

### Step 1: Preparation

1. ✅ Install ECS library: `npm install ./lib/ecs`
2. Create `src/domain/ecs/` directory for ECS-specific code
3. Create component definitions file
4. Create system definitions file

### Step 2: Parallel Implementation

1. Implement ECS components alongside existing classes
2. Create basic systems (Movement, Rendering queries)
3. Create ECS version of GameSession (GameSessionECS)
4. Write tests for ECS implementation

### Step 3: Integration

1. Add feature flag to switch between old/new systems
2. Update GameRenderer to work with ECS queries
3. Test ECS version with existing UI components
4. Performance comparison between old/new systems

### Step 4: Migration

1. Replace GameSession with GameSessionECS in main game loop
2. Remove old object-oriented game classes
3. Update all game systems to use ECS
4. Clean up unused code

### Step 5: Optimization

1. Profile ECS performance
2. Optimize component queries
3. Add more specialized systems as needed
4. Refactor renderer to be more ECS-friendly

## Benefits After Migration

### Performance

- ✅ Cache-friendly data layout
- ✅ Query optimization for common operations
- ✅ Only update systems that need to run

### Maintainability

- ✅ Clear separation of data and behavior
- ✅ Modular systems easy to test independently
- ✅ Easy to add new entity types with component composition

### Flexibility

- ✅ Dynamic entity composition at runtime
- ✅ Easy to add/remove behaviors via components
- ✅ System execution can be controlled per frame

## Risk Mitigation

### Backwards Compatibility

- Keep old classes during transition period
- Feature flags for A/B testing
- Gradual migration system by system

### Testing Strategy

- Unit tests for each component and system
- Integration tests comparing old vs new behavior
- Performance benchmarks

### Rollback Plan

- Maintain old GameSession as fallback
- Feature flag to quickly switch back
- All UI components work with both systems

## Timeline Estimate

- **Week 1**: Setup ECS library, create basic components
- **Week 2**: Implement core systems (Movement, AI, Combat)
- **Week 3**: Create ECS GameSession, integration testing
- **Week 4**: UI integration, performance testing
- **Week 5**: Full migration, cleanup, optimization

This migration will modernize the game architecture while maintaining all existing functionality and improving performance and maintainability.
