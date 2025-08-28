import { describe, expect, it } from "vitest";

import { defineComponent } from "./Component";
import { World } from "./World";

describe("World.query and queryOptional", () => {
  const Position = defineComponent<{ x: number; y: number }>();
  const Velocity = defineComponent<{ dx: number; dy: number }>();
  const Health = defineComponent<{ hp: number }>();

  it("returns only entities with all required components and exact keys", () => {
    const world = new World();
    const e1 = world
      .createEntity()
      .addComponent(Position, { x: 1, y: 2 })
      .addComponent(Velocity, { dx: 3, dy: 4 });
    world
      .createEntity() // e2
      .addComponent(Position, { x: 5, y: 6 });
    const results = world.query({ Position, Velocity });
    // Only e1 should be present
    expect(results.map((r) => r.entity)).toEqual([e1.id]);
    const comps = results[0].components;
    // Exact key presence
    expect(Object.keys(comps).sort()).toEqual(["Position", "Velocity"]);
    expect(comps.Position).toEqual({ x: 1, y: 2 });
    expect(comps.Velocity).toEqual({ dx: 3, dy: 4 });
  });

  it("includes optional components only when present", () => {
    const world = new World();
    const e1 = world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 1, dy: 1 });
    const e2 = world.createEntity().addComponent(Position, { x: 10, y: 10 });

    const results = world.queryOptional({ Position }, { Velocity, Health });
    // Both entities present
    expect(results.map((r) => r.entity).sort()).toEqual([e1.id, e2.id].sort());

    const r1 = results.find((r) => r.entity === e1.id)!;
    const r2 = results.find((r) => r.entity === e2.id)!;

    // e1 has Position + Velocity (no Health)
    expect(Object.keys(r1.components).sort()).toEqual(["Position", "Velocity"]);
    expect(r1.components.Position).toEqual({ x: 0, y: 0 });
    expect(r1.components.Velocity).toEqual({ dx: 1, dy: 1 });

    // e2 has only Position
    expect(Object.keys(r2.components).sort()).toEqual(["Position"]);
    expect(r2.components.Position).toEqual({ x: 10, y: 10 });
  });

  it("does not collide identical-shaped but distinct components", () => {
    const world = new World();
    const A = defineComponent<{ v: number }>();
    const B = defineComponent<{ v: number }>();

    const e = world.createEntity().addComponent(A, { v: 1 }).addComponent(B, { v: 2 });

    const [res] = world.query({ A, B });
    expect(res.entity).toBe(e.id);
    expect(res.components.A).toEqual({ v: 1 });
    expect(res.components.B).toEqual({ v: 2 });
  });
});
