import { describe, expect, it } from "vitest";

import { defineComponent } from "./Component";
import { World } from "./World";

describe("World core behaviors", () => {
  const Position = defineComponent<{ x: number; y: number }>();
  const Velocity = defineComponent<{ dx: number; dy: number }>();

  it("hasEntity tracks lifecycle", () => {
    const world = new World();
    const e = world.createEntity();
    expect(world.hasEntity(e.id)).toBe(true);
    world.removeEntity(e.id);
    expect(world.hasEntity(e.id)).toBe(false);
  });

  it("hasComponent/getComponent reflect add/remove operations", () => {
    const world = new World();
    const e = world.createEntity();
    expect(world.hasComponent(e.id, Position)).toBe(false);
    expect(world.getComponent(e.id, Position)).toBeUndefined();

    e.addComponent(Position, { x: 7, y: 8 });
    expect(world.hasComponent(e.id, Position)).toBe(true);
    expect(world.getComponent(e.id, Position)?.__data).toEqual({ x: 7, y: 8 });

    e.removeComponent(Position);
    expect(world.hasComponent(e.id, Position)).toBe(false);
    expect(world.getComponent(e.id, Position)).toBeUndefined();
  });

  it("query updates after component removal", () => {
    const world = new World();
    const e1 = world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 1, dy: 1 });
    world.createEntity().addComponent(Position, { x: 2, y: 2 });

    // Initial: only e1 has both
    expect(world.query({ Position, Velocity }).map((r) => r.entity)).toEqual([e1.id]);

    // Remove Velocity; query should be empty
    const entity = e1.removeComponent(Velocity);
    expect(entity).toBeDefined();
    expect(world.query({ Position, Velocity })).toEqual([]);
  });
});
