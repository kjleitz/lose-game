import type { Action } from "../../application/input/ActionTypes";
import type { Kinematics2D } from "../../shared/types/geometry";
import { type PlayerInventory, PlayerInventoryManager } from "./inventory/PlayerInventory";

export type PlayerState = Kinematics2D & {
  experience?: number;
  health?: number;
};

export class Player {
  public state: PlayerState;
  public inventory: PlayerInventory;
  private speedMultiplier = 1;
  private readonly MIN_MULT = 0.25;
  private readonly MAX_MULT = 5;

  constructor(initial: PlayerState) {
    this.state = {
      ...initial,
      experience: initial.experience ?? 0,
      health: initial.health ?? 100,
    };

    // Initialize player inventory (20 slots, 100kg max weight)
    this.inventory = new PlayerInventoryManager(20, 100);
  }

  update(dt: number, actions: Set<Action>, visitedPlanet?: boolean): void {
    this.updateSpace(dt, actions, visitedPlanet);
  }

  updateSpace(dt: number, actions: Set<Action>, visitedPlanet?: boolean): void {
    const TURN_SPEED = 2.5;
    const BASE_THRUST = 280; // base ship thrust (units/sec^2)
    const DRAG = 0.98;

    // Adjust speed multiplier with dedicated actions
    if (actions.has("speedUp")) {
      this.speedMultiplier = Math.min(this.MAX_MULT, this.speedMultiplier + 1.0 * dt);
    }
    if (actions.has("speedDown")) {
      this.speedMultiplier = Math.max(this.MIN_MULT, this.speedMultiplier - 1.0 * dt);
    }
    if (actions.has("turnLeft")) this.state.angle -= TURN_SPEED * dt;
    if (actions.has("turnRight")) this.state.angle += TURN_SPEED * dt;
    if (actions.has("thrust")) {
      const boost = actions.has("boost") ? 1.75 : 1;
      const thrust = BASE_THRUST * this.speedMultiplier * boost;
      this.state.vx += Math.cos(this.state.angle) * thrust * dt;
      this.state.vy += Math.sin(this.state.angle) * thrust * dt;
    }
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;
    this.state.vx *= DRAG;
    this.state.vy *= DRAG;
    // Example: decrease health if moving fast
    if (Math.abs(this.state.vx) + Math.abs(this.state.vy) > 500) {
      this.state.health = Math.max(0, (this.state.health ?? 100) - Math.floor(1 * dt * 10));
    }
    // Increment experience if visiting a planet
    if (visitedPlanet) {
      this.state.experience = (this.state.experience ?? 0) + 10;
    }
  }

  updatePlanet(dt: number, actions: Set<Action>): void {
    const WALK_SPEED = 200; // units/sec
    const RUN_SPEED = 350; // units/sec when boosting
    const FRICTION = 0.85; // ground friction

    let speed = WALK_SPEED;
    if (actions.has("boost")) {
      speed = RUN_SPEED;
    }

    // Direct movement (no rotation needed for walking)
    let moveX = 0;
    let moveY = 0;

    if (actions.has("thrust")) moveY -= 1; // W/Up = move up
    if (actions.has("turnLeft")) moveX -= 1; // A/Left = move left
    if (actions.has("turnRight")) moveX += 1; // D/Right = move right
    if (actions.has("moveDown")) moveY += 1; // S/Down = move down

    // Normalize diagonal movement
    if (moveX !== 0 && moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
    }

    // Apply movement
    this.state.vx = moveX * speed;
    this.state.vy = moveY * speed;

    // Update position
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;

    // Apply friction (gradual stop)
    this.state.vx *= FRICTION;
    this.state.vy *= FRICTION;

    // Keep track of facing direction for rendering
    if (moveX !== 0 || moveY !== 0) {
      this.state.angle = Math.atan2(moveY, moveX);
    }
  }

  getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  setSpeedMultiplier(mult: number): void {
    if (!Number.isFinite(mult)) return;
    this.speedMultiplier = Math.min(this.MAX_MULT, Math.max(this.MIN_MULT, mult));
  }
}
