import { World, defineComponent, defineSystem } from "../src/index.js";

// Define components - just data containers
const Position = defineComponent<{ x: number; y: number }>();
const Velocity = defineComponent<{ dx: number; dy: number }>();
const Health = defineComponent<{ current: number; max: number }>();
const Sprite = defineComponent<{
  texture: string;
  scale: number;
}>(() => ({
  texture: "default.png",
  scale: 1,
}));

// Create world
const world = new World();

// Create entities using fluent API
world
  .createEntity()
  .addComponent(Position, { x: 100, y: 100 })
  .addComponent(Velocity, { dx: 2, dy: 0 })
  .addComponent(Health, { current: 100, max: 100 })
  .addComponent(Sprite, { texture: "player.png", scale: 2 });

world
  .createEntity()
  .addComponent(Position, { x: 200, y: 150 })
  .addComponent(Health, { current: 50, max: 50 })
  .addComponent(Sprite); // Uses default values

// Define systems
const MovementSystem = defineSystem(world)
  .withComponents({ Position, Velocity })
  .execute((entities) => {
    entities.forEach(({ entity, components: { Position, Velocity } }) => {
      Position.x += Velocity.dx;
      Position.y += Velocity.dy;

      console.log(`Entity ${entity} moved to (${Position.x}, ${Position.y})`);
    });
  });

const RenderSystem = defineSystem(world)
  .withComponents({ Position, Sprite })
  .withOptionalComponents({ Health })
  .execute((entities) => {
    entities.forEach(({ entity, components: { Position, Sprite, Health } }) => {
      const alpha = Health ? Health.current / Health.max : 1.0;

      console.log(
        `Rendering entity ${entity} at (${Position.x}, ${Position.y}) with texture ${Sprite.texture}, scale ${Sprite.scale}, alpha ${alpha}`,
      );
    });
  });

// Register systems with world
world.addSystem(MovementSystem);
world.addSystem(RenderSystem);

// Game loop simulation
console.log("=== Frame 1 ===");
world.runSystems();

console.log("\n=== Frame 2 ===");
world.runSystems();

// Manual system execution
console.log("\n=== Manual Movement System ===");
MovementSystem.run();

// Query entities directly
console.log("\n=== Direct Query ===");
const entitiesWithHealth = world.query({ Health });
entitiesWithHealth.forEach(({ entity, components: { Health } }) => {
  console.log(`Entity ${entity} has ${Health.current}/${Health.max} health`);
});
