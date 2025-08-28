import { describe, expect, it } from "vitest";

import { defineComponent } from "./Component";
import { defineSystem } from "./System";
import { World } from "./World";

describe("Systems", () => {
  const Position = defineComponent<{ x: number; y: number }>();
  const Velocity = defineComponent<{ dx: number; dy: number }>();
  const Health = defineComponent<{ hp: number; max: number }>();

  it("getEntities returns required + present optional components", () => {
    const world = new World();
    const e1 = world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Velocity, { dx: 1, dy: -2 });
    const e2 = world
      .createEntity()
      .addComponent(Position, { x: 10, y: 10 })
      .addComponent(Health, { hp: 5, max: 10 });

    const sys = defineSystem(world)
      .withComponents({ position: Position })
      .withOptionalComponents({ velocity: Velocity, health: Health })
      .execute(() => {});

    const entities = sys.getEntities();
    const ids = entities.map((r) => r.entity).sort();
    expect(ids).toEqual([e1.id, e2.id].sort());

    const r1 = entities.find((r) => r.entity === e1.id);
    const r2 = entities.find((r) => r.entity === e2.id);
    if (!r1 || !r2) throw new Error("entities not found");

    expect(Object.keys(r1.components).sort()).toEqual(["position", "velocity"]);
    expect(r1.components.position).toEqual({ x: 0, y: 0 });
    expect(r1.components.velocity).toEqual({ dx: 1, dy: -2 });

    expect(Object.keys(r2.components).sort()).toEqual(["health", "position"]);
    expect(r2.components.position).toEqual({ x: 10, y: 10 });
    expect(r2.components.health).toEqual({ hp: 5, max: 10 });
  });

  it("run executes system logic and can mutate component data", () => {
    const world = new World();
    const e = world
      .createEntity()
      .addComponent(Position, { x: 1, y: 2 })
      .addComponent(Velocity, { dx: 3, dy: 4 });

    const movement = defineSystem(world)
      .withComponents({ position: Position, velocity: Velocity })
      .execute((entities) => {
        entities.forEach(({ components: { position, velocity } }) => {
          position.x += velocity.dx;
          position.y += velocity.dy;
        });
      });

    movement.run();
    expect(e.getComponent(Position)).toEqual({ x: 4, y: 6 });
  });

  it("world.runSystems runs added systems in insertion order", () => {
    const world = new World();
    const order: string[] = [];
    const sysA = defineSystem(world)
      .withComponents({})
      .execute(() => order.push("A"));
    const sysB = defineSystem(world)
      .withComponents({})
      .execute(() => order.push("B"));
    world.addSystem(sysA);
    world.addSystem(sysB);

    world.runSystems();
    expect(order).toEqual(["A", "B"]);
  });
});
