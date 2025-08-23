export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  experience?: number;
  health?: number;
};

export class Player {
  public state: PlayerState;
  private speedMultiplier = 1;
  private readonly MIN_MULT = 0.25;
  private readonly MAX_MULT = 5;

  constructor(initial: PlayerState) {
    this.state = {
      ...initial,
      experience: initial.experience ?? 0,
      health: initial.health ?? 100,
    };
  }

  update(dt: number, actions: Set<string>, visitedPlanet?: boolean) {
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

  getSpeedMultiplier() {
    return this.speedMultiplier;
  }

  setSpeedMultiplier(mult: number) {
    if (!Number.isFinite(mult)) return;
    this.speedMultiplier = Math.min(this.MAX_MULT, Math.max(this.MIN_MULT, mult));
  }
}
