import { describe, it, expect } from "vitest";
import { World } from "../../../lib/ecs";
import {
  Enemy,
  Position,
  Collider,
  MeleeWeapon,
  Player,
  Health,
  MeleeStrikeAnim,
} from "../components";
import { createEnemyMeleeSystem } from "./EnemyMeleeSystem";

describe("EnemyMeleeSystem", () => {
  it("reduces player health when within melee reach and triggers animation", () => {
    const world = new World();
    // Player close by
    world
      .createEntity()
      .addComponent(Player)
      .addComponent(Position, { x: 0, y: 0 })
      .addComponent(Collider, { radius: 12 })
      .addComponent(Health, { current: 100, max: 100 });

    // Enemy with melee weapon
    world
      .createEntity()
      .addComponent(Enemy, { id: "c1" })
      .addComponent(Position, { x: 30, y: 0 })
      .addComponent(Collider, { radius: 14 })
      .addComponent(MeleeWeapon, { cooldown: 0.1, remaining: 0, damage: 7, range: 10 });

    const sys = createEnemyMeleeSystem(world, 0.016);
    sys.run();

    const players = world.query({ player: Player, health: Health });
    expect(players[0].components.health.current).toBeLessThan(100);

    // Ensure animation component attached to enemy
    const withAnim = world.query({ enemy: Enemy, anim: MeleeStrikeAnim });
    expect(withAnim.length).toBe(1);
  });
});
