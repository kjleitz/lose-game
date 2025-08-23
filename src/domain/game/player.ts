export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
};

export class Player {
  public state: PlayerState;
  private speedMultiplier = 1;
  private readonly MIN_MULT = 0.25;
  private readonly MAX_MULT = 5;

  constructor(initial: PlayerState) {
    this.state = { ...initial };
  }

  update(dt: number, actions: Set<string>) {
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
  }

  getSpeedMultiplier() {
    return this.speedMultiplier;
  }

  setSpeedMultiplier(mult: number) {
    if (!Number.isFinite(mult)) return;
    this.speedMultiplier = Math.min(this.MAX_MULT, Math.max(this.MIN_MULT, mult));
  }
}
