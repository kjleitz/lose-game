import { describe, it, expect, beforeEach } from "vitest";
import type { EnemyBlackboard } from "./EnemyBlackboard";
import { buildPatrolSeekTree } from "./trees";
import type { Enemy } from "../../game/enemies";
import { Player } from "../../game/player";

describe("Enemy AI Trees", () => {
  let enemy: Enemy;
  let player: Player;
  let blackboard: EnemyBlackboard;
  let tree: ReturnType<typeof buildPatrolSeekTree>;

  beforeEach((): void => {
    enemy = {
      id: "test-enemy",
      x: 0,
      y: 0,
      radius: 14,
      health: 20,
      angle: 0,
      vx: 0,
      vy: 0,
      visionRadius: 700,
      visionHysteresis: 80,
      turnSpeed: 1.8,
      accel: 200,
      maxSpeed: 300,
    };

    player = new Player({ x: 1000, y: 1000, angle: 0, vx: 0, vy: 0, health: 100, experience: 0 });

    blackboard = {
      enemy,
      player,
      planets: [],
      rng: (): number => 0.5,
      time: 0,
      scratch: {
        playerDetected: false,
        waypoint: null,
        waypointReached: false,
        spawnX: 0,
        spawnY: 0,
      },
    };

    tree = buildPatrolSeekTree();
  });

  it("defaults to patrol behavior when player is far away", (): void => {
    // Player is far away, should patrol
    const status = tree.tick(blackboard, 0.016);

    // Should be Running (patrol sequence in progress)
    expect(status).toBe("Running");

    // Should have created a waypoint
    expect(blackboard.scratch.waypoint).toBeDefined();
    expect(blackboard.scratch.spawnX).toBe(0);
    expect(blackboard.scratch.spawnY).toBe(0);
  });

  it("switches to seek behavior when player is detected", (): void => {
    // Place player within detection range
    player.state.x = 500;
    player.state.y = 0;

    const status = tree.tick(blackboard, 0.016);

    // Should complete seek sequence (all actions succeed in one tick)
    expect(status).toBe("Success");

    // Should have marked player as detected
    expect(blackboard.scratch.playerDetected).toBe(true);
  });

  it("maintains seek behavior with hysteresis", (): void => {
    const tree = buildPatrolSeekTree();

    // First, detect player
    player.state.x = 500;
    player.state.y = 0;
    tree.tick(blackboard, 0.016);
    expect(blackboard.scratch.playerDetected).toBe(true);

    // Move player just outside vision but within hysteresis
    player.state.x = 750; // > 700 but < 700 + 80
    const status = tree.tick(blackboard, 0.016);

    // Should still be seeking (hysteresis keeps detection active)
    expect(blackboard.scratch.playerDetected).toBe(true);
    expect(status).toBe("Success");
  });

  it("returns to patrol when player moves beyond hysteresis", (): void => {
    // First, detect player
    player.state.x = 500;
    player.state.y = 0;
    tree.tick(blackboard, 0.016);
    expect(blackboard.scratch.playerDetected).toBe(true);

    // Move player beyond hysteresis threshold
    player.state.x = 800; // > 700 + 80
    tree.tick(blackboard, 0.016);

    // Should return to patrol
    expect(blackboard.scratch.playerDetected).toBe(false);
  });

  it("does nothing when enemy is dead", (): void => {
    enemy.health = 0;

    const status = tree.tick(blackboard, 0.016);

    // Should succeed with doNothing fallback
    expect(status).toBe("Success");

    // No waypoint should be created
    expect(blackboard.scratch.waypoint).toBeNull();
  });

  it("enemy movement integration test", (): void => {
    // Place player within seek range
    player.state.x = 500;
    player.state.y = 0;

    // Multiple ticks to see movement
    for (let i = 0; i < 10; i++) {
      tree.tick(blackboard, 0.1); // Larger dt for visible changes
    }

    // Enemy should have turned towards player and gained velocity
    expect(enemy.angle).toBeGreaterThan(-0.2);
    expect(enemy.angle).toBeLessThan(0.2);
    expect(enemy.vx).toBeGreaterThan(0);
    expect(enemy.x).toBeGreaterThan(0);
  });
});
