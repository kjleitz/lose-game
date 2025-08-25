import { describe, it, expect, beforeEach, vi } from "vitest";
import { CharacterRenderer } from "./CharacterRenderer";

describe("CharacterRenderer", () => {
  let renderer: CharacterRenderer;
  let mockCtx: any;

  beforeEach(() => {
    renderer = new CharacterRenderer();
    
    // Mock canvas context
    mockCtx = {
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
      set fillStyle(value) { this._fillStyle = value; },
      get fillStyle() { return this._fillStyle; },
      set strokeStyle(value) { this._strokeStyle = value; },
      get strokeStyle() { return this._strokeStyle; },
      set lineWidth(value) { this._lineWidth = value; },
      get lineWidth() { return this._lineWidth; },
      set shadowBlur(value) { this._shadowBlur = value; },
      get shadowBlur() { return this._shadowBlur; },
      set shadowColor(value) { this._shadowColor = value; },
      get shadowColor() { return this._shadowColor; },
      set globalAlpha(value) { this._globalAlpha = value; },
      get globalAlpha() { return this._globalAlpha; },
    };
  });

  describe("basic rendering", () => {
    it("should render character with rotation", () => {
      const player = { x: 100, y: 200, vx: 0, vy: 0, angle: Math.PI / 2 };
      const actions = new Set<string>();
      
      renderer.render(mockCtx, player, actions, 32);
      
      expect(mockCtx.translate).toHaveBeenCalledWith(100, 200);
      expect(mockCtx.rotate).toHaveBeenCalledWith(Math.PI / 2);
      expect(mockCtx.save).toHaveBeenCalled();
      expect(mockCtx.restore).toHaveBeenCalled();
    });

    it("should render weapon", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<string>();
      
      renderer.render(mockCtx, player, actions, 32);
      
      // Should draw weapon components
      expect(mockCtx.fillRect).toHaveBeenCalledWith(9.6, -2, 12.8, 4); // gun barrel
      expect(mockCtx.fillRect).toHaveBeenCalledWith(4.8, -3, 6.4, 6); // gun grip
    });

    it("should show firing indicator when fire action is active", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set(["fire"]);
      
      renderer.render(mockCtx, player, actions, 32);
      
      // Should draw firing indicator with glow effect
      expect(mockCtx.shadowBlur).toHaveBeenCalledWith(6);
      expect(mockCtx.arc).toHaveBeenCalledWith(22.4, 0, 3, 0, Math.PI * 2);
    });

    it("should change color when running", () => {
      const player = { x: 0, y: 0, vx: 50, vy: 0, angle: 0 };
      const actionsRunning = new Set(["boost"]);
      const actionsWalking = new Set<string>();
      
      renderer.render(mockCtx, player, actionsRunning, 32);
      expect(mockCtx._fillStyle).toBe("#FF6B6B"); // Red when running
      
      // Reset mock
      mockCtx._fillStyle = undefined;
      
      renderer.render(mockCtx, player, actionsWalking, 32);
      expect(mockCtx._fillStyle).toBe("#4ECDC4"); // Teal when walking
    });

    it("should animate legs when moving", () => {
      const player = { x: 0, y: 0, vx: 50, vy: 0, angle: 0 };
      const actions = new Set<string>();
      
      renderer.render(mockCtx, player, actions, 32);
      
      // Should draw animated legs
      expect(mockCtx.moveTo).toHaveBeenCalledWith(-6.4, 9.6);
      expect(mockCtx.lineTo).toHaveBeenCalled();
    });
  });

  describe("directional rendering", () => {
    it("should render directional indicator", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<string>();
      
      renderer.render(mockCtx, player, actions, 32);
      
      // Should draw directional nose/pointer
      expect(mockCtx.moveTo).toHaveBeenCalledWith(6.4, 0);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(11.2, -3);
      expect(mockCtx.lineTo).toHaveBeenCalledWith(11.2, 3);
    });

    it("should render eyes in correct position", () => {
      const player = { x: 0, y: 0, vx: 0, vy: 0, angle: 0 };
      const actions = new Set<string>();
      
      renderer.render(mockCtx, player, actions, 32);
      
      // Should draw eyes
      expect(mockCtx.arc).toHaveBeenCalledWith(1.6, -4.8, 2, 0, Math.PI * 2);
      expect(mockCtx.arc).toHaveBeenCalledWith(1.6, 4.8, 2, 0, Math.PI * 2);
    });
  });
});