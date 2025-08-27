import { describe, it, expect, beforeEach, vi } from "vitest";
import { CharacterRenderer } from "./CharacterRenderer";
import type { Action } from "../../engine/input/ActionTypes";

interface MockCtx {
  save: () => void;
  restore: () => void;
  translate: (x: number, y: number) => void;
  rotate: (angle: number) => void;
  fillRect: (x: number, y: number, w: number, h: number) => void;
  strokeRect: (x: number, y: number, w: number, h: number) => void;
  beginPath: () => void;
  arc: (x: number, y: number, r: number, start: number, end: number) => void;
  ellipse: (
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
  ) => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  closePath: () => void;
  fill: () => void;
  stroke: () => void;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  shadowBlur: number;
  shadowColor: string;
  globalAlpha: number;
  canvas: HTMLCanvasElement;
  _fillHistory: string[];
  _shadowHistory: number[];
  _fillStyle: string;
  _strokeStyle: string;
  _lineWidth: number;
  _shadowBlur: number;
  _shadowColor: string;
  _globalAlpha: number;
}

describe("CharacterRenderer", () => {
  let renderer: CharacterRenderer;
  let mockCtx: MockCtx;

  beforeEach(() => {
    renderer = new CharacterRenderer();

    // Mock canvas context
    mockCtx = {
      canvas: document.createElement("canvas"),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      _fillHistory: [] as string[],
      _fillStyle: "#000000",
      _strokeStyle: "#000000",
      _lineWidth: 1,
      _shadowHistory: [] as number[],
      _shadowBlur: 0,
      _shadowColor: "#000000",
      _globalAlpha: 1,
      set fillStyle(value: string) {
        this._fillStyle = value;
        this._fillHistory.push(value);
      },
      get fillStyle(): string {
        return this._fillStyle;
      },
      set strokeStyle(value: string) {
        this._strokeStyle = value;
      },
      get strokeStyle(): string {
        return this._strokeStyle;
      },
      set lineWidth(value: number) {
        this._lineWidth = value;
      },
      get lineWidth(): number {
        return this._lineWidth;
      },
      set shadowBlur(value: number) {
        this._shadowBlur = value;
        this._shadowHistory.push(value);
      },
      get shadowBlur(): number {
        return this._shadowBlur;
      },
      set shadowColor(value: string) {
        this._shadowColor = value;
      },
      get shadowColor(): string {
        return this._shadowColor;
      },
      set globalAlpha(value: number) {
        this._globalAlpha = value;
      },
      get globalAlpha(): number {
        return this._globalAlpha;
      },
    };
  });

  describe("basic rendering", () => {
    it("should render character with rotation", () => {
      const player = { x: 100, y: 200, vx: 0, vy: 0, angle: Math.PI / 2 };
      const actions = new Set<Action>();

      renderer.render(mockCtx, player, actions, 32);

      expect(mockCtx.translate).toHaveBeenCalledWith(100, 200);
      expect(mockCtx.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it("should render weapon", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<Action>();

      renderer.render(mockCtx, player, actions, 32);

      // Should draw weapon components
      expect(mockCtx.fillRect).toHaveBeenCalledWith(9.6, -2, 12.8, 4); // gun barrel
      expect(mockCtx.fillRect).toHaveBeenCalledWith(4.8, -3, 6.4, 6); // gun grip
    });

    it("should show firing indicator when fire action is active", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<Action>(["fire"]);

      renderer.render(mockCtx, player, actions, 32);

      // Should draw firing indicator with glow effect (was set during render)
      expect(mockCtx._shadowHistory).toContain(6);
      expect(mockCtx.arc).toHaveBeenCalledWith(22.4, 0, 3, 0, Math.PI * 2);
    });

    it("should change color when running", () => {
      const player = { x: 0, y: 0, vx: 50, vy: 0, angle: 0 };
      const actionsRunning = new Set<Action>(["boost"]);
      const actionsWalking = new Set<Action>();

      renderer.render(mockCtx, player, actionsRunning, 32);
      // Body fill should be set to red at some point during render
      expect(mockCtx._fillHistory).toContain("#FF6B6B");

      // Reset mock
      mockCtx._fillStyle = "";

      renderer.render(mockCtx, player, actionsWalking, 32);
      // Body fill should be set to teal at some point during render
      expect(mockCtx._fillHistory).toContain("#4ECDC4");
    });

    it("should animate legs when moving", () => {
      const player = { x: 0, y: 0, vx: 50, vy: 0, angle: 0 };
      const actions = new Set<Action>();

      renderer.render(mockCtx, player, actions, 32);

      // Should draw animated legs
      expect(mockCtx.moveTo).toHaveBeenCalledWith(-6.4, 9.6);
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });
  });

  describe("directional rendering", () => {
    it("should render directional indicator", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<Action>();

      renderer.render(mockCtx, player, actions, 32);

      // Should draw directional nose/pointer
      expect(mockCtx.moveTo).toHaveBeenCalledWith(6.4, 0);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(11.2, -3);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(11.2, 3);
    });

    it("should render eyes in correct position", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<Action>();

      renderer.render(mockCtx, player, actions, 32);

      // Should draw eyes
      expect(mockCtx.arc).toHaveBeenCalledWith(1.6, -4.8, 2, 0, Math.PI * 2);
      expect(mockCtx.arc).toHaveBeenCalledWith(1.6, 4.8, 2, 0, Math.PI * 2);
    });
  });
});
