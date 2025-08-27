import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import { Position, Rotation, Player, Projectile } from "../components";
import { createWeaponSystem } from "./WeaponSystem";

describe("WeaponSystem", () => {
  it("spawns a projectile when fire action is present", () => {
    const world = new World();
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Rotation, { angle: 0 })
      .addComponent(Player);

    const system = createWeaponSystem(world, new Set(["fire"]));

    system.run();

    const projectiles = world.query({ projectile: Projectile });
    expect(projectiles.length).toBeGreaterThan(0);
  });
});
