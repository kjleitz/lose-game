import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GameApp } from "./GameApp";

// Provide a minimal mock GameLoop that runs update/render once on start
vi.mock("../domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render(): void {}
  },
}));
vi.mock("./game/loop", () => {
  class GameLoopMock {
    private opts: { update: (dt: number) => void; render: () => void };
    constructor(opts: { update: (dt: number) => void; render: () => void }) {
      this.opts = opts;
    }
    start(): void {
      // Simulate one update+render frame
      this.opts.update(1 / 60);
      this.opts.render();
    }
    stop(): void {}
    pause(): void {}
    resume(): void {}
    step(): void {
      this.opts.update(1 / 60);
      this.opts.render();
    }
    isRunning(): boolean {
      return true;
    }
    isPaused(): boolean {
      return false;
    }
  }
  return { GameLoop: GameLoopMock };
});

describe("GameApp", () => {
  let canvas: HTMLCanvasElement;

  beforeEach((): void => {
    canvas = document.createElement("canvas");
    // JSDOM provides 2D context as null; GameRenderer guards it.
  });

  afterEach((): void => {
    // cleanup dom listeners if any were added
  });

  it("creates a controller and publishes tick events on start", async (): Promise<void> => {
    const controller = await GameApp.create(canvas, { size: { width: 320, height: 200 } });
    expect(typeof controller.start).toBe("function");
    expect(typeof controller.stop).toBe("function");
    expect(typeof controller.pause).toBe("function");
    expect(typeof controller.resume).toBe("function");
    expect(typeof controller.dispose).toBe("function");
    expect(typeof controller.setSpeed).toBe("function");
    expect(typeof controller.setZoom).toBe("function");
    expect(typeof controller.getSnapshot).toBe("function");

    let tickCount = 0;
    const unsub = controller.bus.subscribe("tick", (): void => {
      tickCount += 1;
    });

    controller.start();
    // The mocked loop runs once immediately
    expect(tickCount).toBeGreaterThan(0);

    unsub();
    controller.dispose();
  });

  it("publishes inputChanged when actions change and speedChanged when speed changes", async (): Promise<void> => {
    const controller = await GameApp.create(canvas, { size: { width: 320, height: 200 } });
    const events: string[] = [];
    const unsubInput = controller.bus.subscribe("inputChanged", (e): void => {
      events.push(`input:${e.actions.slice().sort().join("|")}`);
    });
    const unsubSpeed = controller.bus.subscribe("speedChanged", (e): void => {
      events.push(`speed:${e.value.toFixed(2)}`);
    });

    controller.dispatch("thrust");
    controller.start();

    // Changing speed via API should publish speedChanged
    controller.setSpeed(2);

    expect(events.some((s) => s.startsWith("input:"))).toBe(true);
    expect(events.some((s) => s.startsWith("speed:"))).toBe(true);

    unsubInput();
    unsubSpeed();
    controller.dispose();
  });
});
