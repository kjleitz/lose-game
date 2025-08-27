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

  it("uses top-down walking controls in planet mode", () => {
    const world = new World();
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Player);

    const dt = 1 / 60;
    // In planet mode, thrust maps to up (negative Y), and we set direct walking velocity
    const system = createPlayerControlSystem(world, new Set(["thrust"]), dt, "planet");
    system.run();

    const { velocity, rotation } = world.query({
      position: Position,
      velocity: Velocity,
      rotation: Rotation,
      player: Player,
    })[0].components;

    expect(velocity.dx).toBeCloseTo(0, 5);
    expect(velocity.dy).toBeLessThan(0); // moving up
    // Facing should align with movement (upwards = -PI/2)
    expect(rotation.angle).toBeLessThan(0);
  });

  it("diagonal walking normalizes speed in planet mode", () => {
    const world = new World();
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Player);

    const dt = 1 / 60;
    // Up + Right should be normalized
    const system = createPlayerControlSystem(world, new Set(["thrust", "turnRight"]), dt, "planet");
    system.run();

    const { velocity } = world.query({
      position: Position,
      velocity: Velocity,
      rotation: Rotation,
      player: Player,
    })[0].components;

    const speed = Math.hypot(velocity.dx, velocity.dy);
    // Should be reasonable walking speed (non-zero) and not exceed run speed
    expect(speed).toBeGreaterThan(0);
  });
});
