import { describe, expect, it } from "vitest";

import { defineComponent } from "./Component";
import { World } from "./World";

describe("Entity builder and component ops", () => {
  const Position = defineComponent<{ x: number; y: number }>();
  const Health = defineComponent<{ hp: number }>();

  it("supports fluent chaining and has/get/remove component workflow", () => {
    const world = new World();
    const entity = world
      .createEntity()
      .addComponent(Position, { x: 1, y: 2 })
      .addComponent(Health, { hp: 10 });

    expect(entity.hasComponent(Position)).toBe(true);
    expect(entity.hasComponent(Health)).toBe(true);
    expect(entity.getComponent(Position)).toEqual({ x: 1, y: 2 });
    expect(entity.getComponent(Health)).toEqual({ hp: 10 });

    entity.removeComponent(Health);
    expect(entity.hasComponent(Health)).toBe(false);
    expect(entity.getComponent(Health)).toBeUndefined();
  });

  it("exposes live component data that can be mutated in-place", () => {
    const world = new World();
    const entity = world.createEntity().addComponent(Position, { x: 0, y: 0 });
    const pos = entity.getComponent(Position);
    expect(pos).toEqual({ x: 0, y: 0 });
    if (!pos) throw new Error("Position should exist");
    pos.x += 5;
    pos.y -= 3;
    expect(entity.getComponent(Position)).toEqual({ x: 5, y: -3 });
  });

  it("removeEntity deletes entity and its components", () => {
    const world = new World();
    const e = world.createEntity().addComponent(Position, { x: 1, y: 2 });
    expect(world.hasEntity(e.id)).toBe(true);
    world.removeEntity(e.id);
    expect(world.hasEntity(e.id)).toBe(false);
    // Subsequent queries should not include the entity
    const results = world.query({ Position });
    expect(results.find((r) => r.entity === e.id)).toBeUndefined();
  });

  it("adding a component to a non-existent entity throws", () => {
    const world = new World();
    const NotThere = defineComponent<{ v: number }>();
    expect(() => {
      world.addComponentToEntity(999, NotThere, NotThere.create({ v: 1 }));
    }).toThrowError(/does not exist/);
  });

  it("removing a component from an entity that lacks it is a no-op", () => {
    const world = new World();
    const e = world.createEntity();
    expect(() => e.removeComponent(Health)).not.toThrow();
  });
});
