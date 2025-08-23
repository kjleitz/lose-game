export type PlayerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
};

export class Player {
  public state: PlayerState;

  constructor(initial: PlayerState) {
    this.state = { ...initial };
  }

  update(dt: number, actions: Set<string>) {
    const TURN_SPEED = 2.5;
    const THRUST = 200;
    const DRAG = 0.98;
    if (actions.has("turnLeft")) this.state.angle -= TURN_SPEED * dt;
    if (actions.has("turnRight")) this.state.angle += TURN_SPEED * dt;
    if (actions.has("thrust")) {
      this.state.vx += Math.cos(this.state.angle) * THRUST * dt;
      this.state.vy += Math.sin(this.state.angle) * THRUST * dt;
    }
    this.state.x += this.state.vx * dt;
    this.state.y += this.state.vy * dt;
    this.state.vx *= DRAG;
    this.state.vy *= DRAG;
  }
}
