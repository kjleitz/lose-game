import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import {
  Enemy,
  Position,
  Rotation,
  AIVision,
  RangedWeapon,
  Player,
  Collider,
  Projectile,
} from "../components";
import { createEnemyRangedWeaponSystem } from "./EnemyRangedWeaponSystem";

describe("EnemyRangedWeaponSystem", () => {
  it("spawns a projectile when player is in range and visible", () => {
    const world = new World();
    // Player target
    world
      .createEntity()
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Collider, { radius: 16 })
      .addComponent(Player);

    // Enemy with ranged weapon looking at player
    world
      .createEntity()
      .addComponent(Enemy, { id: "e1" })
      .addComponent(Position, { x: 100, y: 0 })
      .addComponent(Rotation, { angle: Math.PI })
      .addComponent(AIVision, { radius: 500, hysteresis: 50, hasTarget: true })
      .addComponent(RangedWeapon, {
        cooldown: 0.1,
        remaining: 0,
        projectileSpeed: 300,
        spread: 0,
        damage: 5,
        range: 500,
        color: "#f00",
      });

    const sys = createEnemyRangedWeaponSystem(world, 0.016);
    sys.run();
    const projs = world.query({ projectile: Projectile });
    expect(projs.length).toBeGreaterThan(0);
  });
});
