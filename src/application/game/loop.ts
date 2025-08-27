export type UpdateFn = (dt: number) => void;
export type RenderFn = () => void;

export type NowFn = () => number;
export type ScheduleFn = (cb: FrameRequestCallback) => number;
export type CancelFn = (id: number) => void;

export interface GameLoopOptions {
  update: UpdateFn;
  render: RenderFn;
  fixedDelta?: number; // seconds
  maxUpdatesPerFrame?: number;
  now?: NowFn;
  schedule?: ScheduleFn;
  cancel?: CancelFn;
}

export class GameLoop {
  private update: UpdateFn;
  private render: RenderFn;
  private fixedDelta: number;
  private maxUpdatesPerFrame: number;
  private now: NowFn;
  private schedule: ScheduleFn;
  private cancel: CancelFn;

  private running = false;
  private paused = false;
  private accumulator = 0;
  private lastTime = 0;
  private rafId: number | null = null;

  constructor(options: GameLoopOptions) {
    this.update = options.update;
    this.render = options.render;
    this.fixedDelta = options.fixedDelta ?? 1 / 60;
    this.maxUpdatesPerFrame = options.maxUpdatesPerFrame ?? 5;
    this.now = options.now ?? ((): number => performance.now());
    this.schedule =
      options.schedule ?? ((cb: FrameRequestCallback): number => window.requestAnimationFrame(cb));
    this.cancel = options.cancel ?? ((id: number): void => window.cancelAnimationFrame(id));
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.accumulator = 0;
    this.lastTime = this.now();

    const tick = (_ts?: number): void => {
      if (!this.running || this.paused) return;
      const current = this.now();
      let delta = (current - this.lastTime) / 1000;
      this.lastTime = current;

      // Avoid huge catch-ups after tab inactive
      if (delta > 0.25) delta = 0.25;

      this.accumulator += delta;
      let updates = 0;
      while (this.accumulator >= this.fixedDelta && updates < this.maxUpdatesPerFrame) {
        this.update(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
        updates++;
      }

      this.render();
      this.rafId = this.schedule(tick);
    };
    this.rafId = this.schedule(tick);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.rafId !== null) {
      this.cancel(this.rafId);
      this.rafId = null;
    }
  }

  pause(): void {
    if (!this.running || this.paused) return;
    this.paused = true;
    if (this.rafId !== null) {
      this.cancel(this.rafId);
      this.rafId = null;
    }
  }

  resume(): void {
    if (!this.running || !this.paused) return;
    this.paused = false;
    this.lastTime = this.now();
    const tick = (_ts?: number): void => {
      if (!this.running || this.paused) return;
      const current = this.now();
      let delta = (current - this.lastTime) / 1000;
      this.lastTime = current;
      if (delta > 0.25) delta = 0.25;
      this.accumulator += delta;
      let updates = 0;
      while (this.accumulator >= this.fixedDelta && updates < this.maxUpdatesPerFrame) {
        this.update(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
        updates++;
      }
      this.render();
      this.rafId = this.schedule(tick);
    };
    this.rafId = this.schedule(tick);
  }

  step(): void {
    // Single deterministic step without scheduling
    this.update(this.fixedDelta);
    this.render();
  }

  isRunning(): boolean {
    return this.running;
  }

  isPaused(): boolean {
    return this.paused;
  }
}
