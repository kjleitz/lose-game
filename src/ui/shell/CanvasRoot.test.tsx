import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CanvasRoot } from "./CanvasRoot";

// Avoid heavy canvas work in tests
vi.mock("../../domain/render/GameRenderer", () => ({
  GameRenderer: class {
    render(): void {}
  },
}));
// Use a minimal loop that runs one update+render
vi.mock("../../application/game/loop", () => ({
  GameLoop: class {
    private opts: { update: (dt: number) => void; render: () => void };
    constructor(opts: { update: (dt: number) => void; render: () => void }) {
      this.opts = opts;
    }
    start(): void {
      this.opts.update(1 / 60);
      this.opts.render();
    }
    stop(): void {}
    pause(): void {}
    resume(): void {}
  },
}));

// Spies captured from the mocked controller
const hoisted = vi.hoisted(() => ({
  pauseSpy: vi.fn(),
  resumeSpy: vi.fn(),
}));

// Mock GameApp to provide a lightweight controller with pause/resume spies
vi.mock("../../application/GameApp", () => {
  const subscribers: Array<() => void> = [];
  const bus = {
    subscribe: (_type: string, _handler: (e: unknown) => void): (() => void) => {
      const unsub = (): void => {};
      subscribers.push(unsub);
      return unsub;
    },
    publish: (_e: unknown): void => {},
    onAny:
      (_h: (e: unknown) => void): (() => void) =>
      (): void => {},
  };
  const controller = {
    start: (): void => {},
    stop: (): void => {},
    pause: hoisted.pauseSpy,
    resume: hoisted.resumeSpy,
    dispose: (): void => {},
    setSpeed: (_n: number): void => {},
    getSpeed: (): number => 1,
    setZoom: (_z: number): void => {},
    getSnapshot: (): unknown => ({
      mode: "space" as const,
      planet: undefined,
      player: {
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        angle: 0,
        health: 100,
        healthMax: 100,
        experience: 0,
        level: 1,
        xpToNextLevel: 100,
        perkPoints: 0,
        perks: {},
      },
      camera: { x: 0, y: 0, zoom: 1 },
      planets: [],
      stars: [],
      enemies: [],
      projectiles: [],
      stats: { fps: 60, entityCount: { players: 1, enemies: 0, planets: 0, projectiles: 0 } },
    }),
    bus,
    dispatch: (_a: unknown): void => {},
    rebind: (_a: unknown, _c: string): void => {},
  };
  return {
    GameApp: {
      create: (): Promise<typeof controller> => Promise.resolve(controller),
    },
  };
});

type FnMock = ReturnType<typeof vi.fn>;
function getMockController(): { pause: FnMock; resume: FnMock } {
  return { pause: hoisted.pauseSpy, resume: hoisted.resumeSpy };
}

describe("CanvasRoot", () => {
  it("renders canvas and HUD elements", (): void => {
    const { container } = render(<CanvasRoot />);
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
    // HUD text shows 'idle' initially (no actions)
    expect(screen.getByText("idle")).toBeInTheDocument();
    // Container still present
    const div = container.querySelector(".relative.w-screen.h-screen.overflow-hidden");
    expect(div).not.toBeNull();
  });

  it("pauses when opening Settings and resumes on close", async (): Promise<void> => {
    render(<CanvasRoot />);
    const ctrl = getMockController();
    // Open settings via the top-right settings button (aria-label)
    const settingsBtn = await screen.findByRole("button", { name: /open settings/i });
    fireEvent.click(settingsBtn);
    await waitFor(() => expect(ctrl.pause).toHaveBeenCalled());
    // Close settings by clicking the modal Close button
    const closeBtn = await screen.findByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    await waitFor(() => expect(ctrl.resume).toHaveBeenCalled());
  });

  it("pauses when opening Perks and resumes on close", async (): Promise<void> => {
    render(<CanvasRoot />);
    const ctrl = getMockController();
    // Open perks via the status panel button
    const perksBtn = await screen.findByRole("button", { name: /perks|perk/i });
    fireEvent.click(perksBtn);
    await waitFor(() => expect(ctrl.pause).toHaveBeenCalled());
    // Close perks by clicking the modal Close button
    const closeBtn = await screen.findByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    await waitFor(() => expect(ctrl.resume).toHaveBeenCalled());
  });
});
