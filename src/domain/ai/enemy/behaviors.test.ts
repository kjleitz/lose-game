import { describe, it, expect, beforeEach } from "vitest";
import type { EnemyBlackboard } from "./EnemyBlackboard";
import {
  isAlive,
  playerDetected,
  arrivedAtWaypoint,
  ensureWaypoint,
  faceTarget,
  thrustForward,
  moveToPosition,
} from "./behaviors";
import type { Enemy } from "../../game/enemies";
import { Player } from "../../game/player";

describe("Enemy AI Behaviors", () => {
  let enemy: Enemy;
  let player: Player;
  let blackboard: EnemyBlackboard;

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

    player = new Player({ x: 100, y: 100, angle: 0, vx: 0, vy: 0, health: 100, experience: 0 });

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
  });

  describe("isAlive condition", () => {
    it("returns Success when enemy has health > 0", (): void => {
      const node = isAlive();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
    });

    it("returns Failure when enemy health <= 0", (): void => {
      enemy.health = 0;
      const node = isAlive();
      expect(node.tick(blackboard, 0.016)).toBe("Failure");
    });
  });

  describe("playerDetected condition", () => {
    it("detects player within vision radius", (): void => {
      // Place player within vision radius
      player.state.x = 500;
      player.state.y = 0;

      const node = playerDetected();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
      expect(blackboard.scratch.playerDetected).toBe(true);
    });

    it("does not detect player outside vision radius", (): void => {
      // Place player outside vision radius
      player.state.x = 800;
      player.state.y = 0;

      const node = playerDetected();
      expect(node.tick(blackboard, 0.016)).toBe("Failure");
      expect(blackboard.scratch.playerDetected).toBe(false);
    });

    it("uses hysteresis when player was previously detected", (): void => {
      const node = playerDetected();

      // First detect player
      player.state.x = 500;
      player.state.y = 0;
      expect(node.tick(blackboard, 0.016)).toBe("Success");

      // Move player just outside vision radius but within hysteresis
      player.state.x = 750; // > 700 but < 700 + 80
      expect(node.tick(blackboard, 0.016)).toBe("Success");

      // Move player beyond hysteresis threshold
      player.state.x = 800; // > 700 + 80
      expect(node.tick(blackboard, 0.016)).toBe("Failure");
    });
  });

  describe("ensureWaypoint action", () => {
    it("creates waypoint when none exists", (): void => {
      const node = ensureWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
      expect(blackboard.scratch.waypoint).toBeDefined();
      expect(blackboard.scratch.spawnX).toBe(0);
      expect(blackboard.scratch.spawnY).toBe(0);
    });

    it("preserves existing waypoint when not reached", (): void => {
      const existingWaypoint = { x: 100, y: 100 };
      blackboard.scratch.waypoint = existingWaypoint;
      blackboard.scratch.waypointReached = false;

      const node = ensureWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
      expect(blackboard.scratch.waypoint).toBe(existingWaypoint);
    });

    it("creates new waypoint when current one is reached", (): void => {
      const oldWaypoint = { x: 100, y: 100 };
      blackboard.scratch.waypoint = oldWaypoint;
      blackboard.scratch.waypointReached = true;

      const node = ensureWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
      expect(blackboard.scratch.waypoint).not.toBe(oldWaypoint);
    });
  });

  describe("faceTarget action", () => {
    it("turns towards player target", (): void => {
      // Place player to the right (angle should approach 0)
      player.state.x = 100;
      player.state.y = 0;
      enemy.angle = Math.PI; // Facing left

      const node = faceTarget("player");
      const status = node.tick(blackboard, 0.1); // Longer dt for visible turn

      // Enemy should turn towards player (from PI towards 0)
      expect(enemy.angle).toBeLessThan(Math.PI); // Should have turned
      expect(enemy.angle).toBeGreaterThan(Math.PI - 0.2); // But not all the way
      expect(status).toBe("Running"); // Still turning
    });

    it("returns Success when facing target within tolerance", (): void => {
      // Already facing player
      player.state.x = 100;
      player.state.y = 0;
      enemy.angle = 0;

      const node = faceTarget("player");
      expect(node.tick(blackboard, 0.016)).toBe("Success");
    });

    it("turns towards waypoint target", (): void => {
      blackboard.scratch.waypoint = { x: 0, y: 100 };
      enemy.angle = 0; // Facing right, should turn to face up (π/2)

      const node = faceTarget("waypoint");
      const status = node.tick(blackboard, 0.1);

      expect(enemy.angle).toBeGreaterThan(0);
      expect(enemy.angle).toBeLessThan(Math.PI / 2);
      expect(status).toBe("Running");
    });
  });

  describe("thrustForward action", () => {
    it("accelerates enemy in facing direction", (): void => {
      enemy.angle = 0; // Facing right
      enemy.vx = 0;
      enemy.vy = 0;

      const node = thrustForward();
      expect(node.tick(blackboard, 0.1)).toBe("Success");

      expect(enemy.vx).toBeGreaterThan(0);
      expect(enemy.vy).toBeCloseTo(0, 2);
    });

    it("clamps velocity to max speed", (): void => {
      enemy.vx = 250;
      enemy.vy = 250; // Speed > maxSpeed (300)

      const node = thrustForward();
      node.tick(blackboard, 0.1);

      const speed = Math.hypot(enemy.vx, enemy.vy);
      expect(speed).toBeLessThanOrEqual(enemy.maxSpeed + 0.1); // Small tolerance
    });
  });

  describe("moveToPosition action", () => {
    it("updates enemy position based on velocity", (): void => {
      enemy.x = 0;
      enemy.y = 0;
      enemy.vx = 100;
      enemy.vy = 50;

      const node = moveToPosition();
      expect(node.tick(blackboard, 0.1)).toBe("Success");

      expect(enemy.x).toBeCloseTo(10, 1);
      expect(enemy.y).toBeCloseTo(5, 1);
    });

    it("applies drag to velocity", (): void => {
      enemy.vx = 100;
      enemy.vy = 100;

      const node = moveToPosition();
      node.tick(blackboard, 0.1);

      expect(enemy.vx).toBeLessThan(100);
      expect(enemy.vy).toBeLessThan(100);
    });
  });

  describe("arrivedAtWaypoint condition", () => {
    it("returns Success when close to waypoint", (): void => {
      blackboard.scratch.waypoint = { x: 30, y: 40 }; // Distance = 50, exactly at tolerance
      enemy.x = 0;
      enemy.y = 0;

      const node = arrivedAtWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Success");
    });

    it("returns Failure when far from waypoint", (): void => {
      blackboard.scratch.waypoint = { x: 100, y: 100 };
      enemy.x = 0;
      enemy.y = 0;

      const node = arrivedAtWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Failure");
    });

    it("returns Failure when no waypoint exists", (): void => {
      const node = arrivedAtWaypoint();
      expect(node.tick(blackboard, 0.016)).toBe("Failure");
    });
  });
});
