import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Position, Velocity, Rotation, Player } from "../components";
import { createPlayerControlSystem } from "./PlayerControlSystem";

describe("PlayerControlSystem", () => {
  it("applies thrust to increase velocity", () => {
    const world = new World();
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Player);

    const dt = 1 / 60;
    const system = createPlayerControlSystem(world, new Set(["thrust"]), dt);

    // Run one tick
    system.run();

    const entities = world.query({
      position: Position,
      velocity: Velocity,
      rotation: Rotation,
      player: Player,
    });
    expect(entities.length).toBe(1);
    const { velocity } = entities[0].components;
    expect(velocity.dx).toBeGreaterThan(0);
    // Should not move in Y when angle is 0
    expect(Math.abs(velocity.dy)).toBeLessThan(1e-6);
  });

  it("turns left/right using action names", () => {
    const world = new World();
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Player);

    const dt = 1 / 60;
    const leftSystem = createPlayerControlSystem(world, new Set(["turnLeft"]), dt);
    leftSystem.run();

    let { rotation } = world.query({ rotation: Rotation, player: Player })[0].components;
    const angleAfterLeft = rotation.angle;
    expect(angleAfterLeft).toBeLessThan(0);

    const rightSystem = createPlayerControlSystem(world, new Set(["turnRight"]), dt);
    rightSystem.run();

    rotation = world.query({ rotation: Rotation, player: Player })[0].components.rotation;
    expect(rotation.angle).toBeLessThanOrEqual(0); // left then right should trend back toward 0
  });
});
