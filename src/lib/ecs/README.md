# ECS Library

A lightweight, type-safe Entity Component System for TypeScript/JavaScript applications.

## Overview

This ECS (Entity Component System) library provides a clean, intuitive API for building games and simulations using the ECS architectural pattern. It emphasizes type safety, performance, and ease of use.

## Core Concepts

- **Entity**: A unique identifier that represents a game object
- **Component**: Plain data objects that define properties
- **System**: Functions that operate on entities with specific component combinations
- **World**: Container that manages entities, components, and systems

## Quick Example

```typescript
import { World, defineComponent, defineSystem } from "./src/index.js";

// Define components
const Position = defineComponent<{ x: number; y: number }>();
const Velocity = defineComponent<{ dx: number; dy: number }>();

// Create world and entities
const world = new World();
const entity = world
  .createEntity()
  .addComponent(Position, { x: 0, y: 0 })
  .addComponent(Velocity, { dx: 1, dy: 1 });

// Define a system
const MovementSystem = defineSystem(world)
  .withComponents({ position: Position, velocity: Velocity })
  .execute((entities) => {
    entities.forEach(({ entity, components: { position, velocity } }) => {
      position.x += velocity.dx;
      position.y += velocity.dy;
    });
  });

// Run the system
MovementSystem.run();
```

## API Reference

### World

The main container for your ECS setup.

```typescript
const world = new World();

// Entity management
const entity = world.createEntity();
world.removeEntity(entity);
world.hasEntity(entity); // boolean

// Component queries
world.query({ position: Position, velocity: Velocity }); // Get all entities with both components
world.queryOptional({ position: Position }, { sprite: Sprite }); // Optional components may be undefined

// System management
world.addSystem(MovementSystem);
world.runSystems(); // Runs all registered systems
```

### Components

Components are defined using `defineComponent` and are pure data containers.

```typescript
// Simple component
const Health = defineComponent<{ current: number; max: number }>();

// Component with default values
const Sprite = defineComponent<{
  texture: string;
  scale: number;
}>(() => ({
  texture: "default.png",
  scale: 1,
}));

// Add to entity
entity.addComponent(Health, { current: 100, max: 100 });
entity.addComponent(Sprite); // Uses defaults

// Component operations
entity.hasComponent(Health); // boolean
entity.getComponent(Health); // { current: number; max: number } | undefined
entity.removeComponent(Health);
```

### Systems

Systems are defined using `defineSystem` and operate on entities with specific components.

```typescript
// Basic system
const HealthSystem = defineSystem(world)
  .withComponents({ health: Health, position: Position })
  .execute((entities) => {
    entities.forEach(({ entity, components: { health, position } }) => {
      // System logic here
    });
  });

// System with optional components
const RenderSystem = defineSystem(world)
  .withComponents({ position: Position, sprite: Sprite })
  .withOptionalComponents({ health: Health }) // Health may be undefined
  .execute((entities) => {
    entities.forEach(({ entity, components: { position, sprite, health } }) => {
      const alpha = health ? health.current / health.max : 1.0;
      // Render logic
    });
  });

// Run system manually
HealthSystem.run();

// Or register with world
world.addSystem(HealthSystem);
world.runSystems(); // Runs all registered systems
```

### Entity Builder Pattern

Entities support a fluent builder pattern for easy setup:

```typescript
const player = world
  .createEntity()
  .addComponent(Position, { x: 100, y: 100 })
  .addComponent(Health, { current: 100, max: 100 })
  .addComponent(Sprite, { texture: "player.png", scale: 2 });
```

## Design Principles

1. **Type Safety**: Full TypeScript support with compile-time type checking
2. **Performance**: Efficient component storage and querying
3. **Simplicity**: Clean, readable API that's easy to understand
4. **Flexibility**: Support for optional components and dynamic queries
5. **Immutability-friendly**: Components can be easily replaced/updated

## Performance Considerations

- Components are stored in efficient maps for fast lookup
- Queries are cached and invalidated only when necessary
- Systems only process entities that match their component requirements
- No unnecessary object creation during system execution

## Examples

See the `examples/` directory for complete working examples:

- **`basic-usage.ts`** - Simple movement and rendering systems
- **`game-simulation.ts`** - Complete game loop with AI, combat, and projectiles

### Running Examples

```bash
cd lib/ecs
npm run build
node examples/basic-usage.js
node examples/game-simulation.js
```

## Usage Patterns

### Game Loop Integration

```typescript
class Game {
  private world = new World();

  init() {
    // Setup entities and systems
    this.world.addSystem(MovementSystem);
    this.world.addSystem(CollisionSystem);
    this.world.addSystem(RenderSystem);
  }

  update() {
    this.world.runSystems();
  }
}
```

### Component Composition

```typescript
// Create reusable component sets
function createPlayer(world: World, x: number, y: number) {
  return world
    .createEntity()
    .addComponent(Position, { x, y })
    .addComponent(Velocity, { dx: 0, dy: 0 })
    .addComponent(Health, { current: 100, max: 100 })
    .addComponent(Sprite, { texture: "player.png", scale: 1 });
}

function createEnemy(world: World, x: number, y: number) {
  return world
    .createEntity()
    .addComponent(Position, { x, y })
    .addComponent(Health, { current: 50, max: 50 })
    .addComponent(AI, { state: "patrol" })
    .addComponent(Sprite, { texture: "enemy.png", scale: 1 });
}
```
