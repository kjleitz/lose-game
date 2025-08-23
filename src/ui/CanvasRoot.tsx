import { useEffect, useRef, useState } from "react";
import { GameLoop } from "../engine/loop";
import { createRenderer } from "../engine/renderer";
import type { ActionState } from "../engine/input";
import {
  consumeQueue,
  createActionQueue,
  createActionState,
  enqueueKeyEvent,
} from "../engine/input";
import { createCamera, cameraTransform, setCameraPosition } from "../engine/camera";
import { drawShipTriangle } from "../engine/sprites";
import { drawThruster } from "../engine/sprites";
import { drawStarfield } from "../engine/starfield";

function useCanvasSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

export default function CanvasRoot() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loopRef = useRef<GameLoop | null>(null);
  const actionsRef = useRef<ActionState>(createActionState());
  const actionQueueRef = useRef(createActionQueue());
  const cameraRef = useRef(createCamera(0, 0, 1));
  const playerRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, angle: 0 });
  const [actions, setActions] = useState<ActionState>(() => actionsRef.current);
  const [paused, setPaused] = useState(false);
  const size = useCanvasSize();

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      // Debug controls
      if (e.code === "Escape") {
        const loop = loopRef.current;
        if (loop) {
          if (loop.isPaused()) {
            loop.resume();
            setPaused(false);
          } else {
            loop.pause();
            setPaused(true);
          }
        }
        e.preventDefault();
        return;
      }
      if (e.code === "Backquote") {
        const loop = loopRef.current;
        if (loop && loop.isRunning()) {
          if (loop.isPaused()) loop.step();
          else {
            // Optional: allow single-step while running by briefly pausing
            loop.pause();
            setPaused(true);
            loop.step();
          }
        }
        e.preventDefault();
        return;
      }
      // Game actions → enqueue for deterministic per-tick consumption
      enqueueKeyEvent(actionQueueRef.current, e.code, true);
    };
    const onUp = (e: KeyboardEvent) => {
      enqueueKeyEvent(actionQueueRef.current, e.code, false);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Handle HiDPI rendering
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    const renderer = createRenderer(ctx);

    const update = (dt: number) => {
      // Consume queued input once per tick for deterministic state.
      const prev = actionsRef.current;
      const next = consumeQueue(prev, actionQueueRef.current);
      if (next !== prev) {
        actionsRef.current = next;
        // Minimize re-renders: only set state if changed.
        setActions(next);
      }

      // Simple ship control: thrust and turn
      const TURN_SPEED = 2.5; // rad/s
      const THRUST = 200; // units/s^2
      const DRAG = 0.98; // naive drag per tick (frame-rate independent-ish with fixed dt)
      const ship = playerRef.current;
      if (next.has("turnLeft")) ship.angle -= TURN_SPEED * dt;
      if (next.has("turnRight")) ship.angle += TURN_SPEED * dt;
      if (next.has("thrust")) {
        ship.vx += Math.cos(ship.angle) * THRUST * dt;
        ship.vy += Math.sin(ship.angle) * THRUST * dt;
      }
      // Integrate
      ship.x += ship.vx * dt;
      ship.y += ship.vy * dt;
      // Drag
      ship.vx *= DRAG;
      ship.vy *= DRAG;

      // Camera follows player
      setCameraPosition(cameraRef.current, ship.x, ship.y);
    };

    const render = () => {
      renderer.clear();
      // Background starfield with parallax layers
      const cam = cameraRef.current;
      const layers = [
        { p: 0.4, opts: { starsPerCell: 10, minSize: 0.6, maxSize: 2 } },
        { p: 0.8, opts: { starsPerCell: 6, minSize: 0.4, maxSize: 1.2 } },
      ];
      for (const layer of layers) {
        const camL = { x: cam.x * layer.p, y: cam.y * layer.p, zoom: cam.zoom };
        const [la, lb, lc, ld, le, lf] = cameraTransform(camL, size.width, size.height, dpr);
        ctx.setTransform(la, lb, lc, ld, le, lf);
        drawStarfield(ctx, camL, size.width, size.height, layer.opts);
      }

      // World entities
      const [a, b, c, d, e, f] = cameraTransform(cam, size.width, size.height, dpr);
      ctx.setTransform(a, b, c, d, e, f);
      const ship = playerRef.current;
      // Thruster FX (draw under the ship for glow, then ship on top)
      const thrusting = actionsRef.current.has("thrust");
      if (thrusting) {
        const speed = Math.hypot(ship.vx, ship.vy);
        const power = Math.min(1, 0.3 + speed / 300);
        drawThruster(ctx, ship.x, ship.y, ship.angle, "#57ffd8", 24, power);
      }
      drawShipTriangle(ctx, ship.x, ship.y, ship.angle, "#57ffd8", 24);

      // FX layer hook for later (particles, etc.)
    };

    const loop = new GameLoop({ update, render });
    loopRef.current = loop;
    loop.start();
    return () => loop.stop();
  }, [size.width, size.height]);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={size.width}
        height={size.height}
        className="block w-full h-full"
      />
      {/* HUD overlay slot */}
      <div className="pointer-events-none absolute inset-0 p-4 flex items-start justify-between">
        <div className="hud-panel px-3 py-2 pointer-events-auto">
          <div className="hud-text text-sm">L.O.S.E.</div>
        </div>
        <div className="hud-panel px-3 py-2 space-y-1 pointer-events-auto">
          <div className="hud-text text-xs opacity-80">
            {Array.from(actions).join(", ") || "idle"}
          </div>
          {paused && <div className="hud-text text-xs">paused</div>}
        </div>
      </div>
    </div>
  );
}
