import { useRef, useEffect } from "react";
import { GameRenderer } from "../../domain/render/GameRenderer";
import type { Planet } from "../../domain/game/planets";
import type { Enemy } from "../../domain/game/enemies";

export function CanvasRenderer({
  player,
  camera,
  planets,
  projectiles,
  enemies,
  actions,
  size,
}: {
  player: { x: number; y: number; vx: number; vy: number; angle: number };
  camera: { x: number; y: number; zoom: number };
  planets: Planet[];
  projectiles: Array<{ x: number; y: number; radius: number }>;
  enemies: Enemy[];
  actions: Set<string>;
  size: { width: number; height: number };
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Refs to always have latest props in animation loop
  const playerRef = useRef(player);
  const cameraRef = useRef(camera);
  const planetsRef = useRef(planets);
  const projectilesRef = useRef(projectiles);
  const enemiesRef = useRef(enemies);
  const actionsRef = useRef(actions);
  const sizeRef = useRef(size);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);
  useEffect(() => {
    cameraRef.current = camera;
  }, [camera]);
  useEffect(() => {
    planetsRef.current = planets;
  }, [planets]);
  useEffect(() => {
    projectilesRef.current = projectiles;
  }, [projectiles]);
  useEffect(() => {
    enemiesRef.current = enemies;
  }, [enemies]);
  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  // Only resize canvas when size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
  }, [size]);

  // Animation loop only runs once on mount
  useEffect(() => {
    let running = true;
    const renderer = new GameRenderer();
    function renderFrame() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      renderer.render(
        ctx,
        playerRef.current,
        cameraRef.current,
        planetsRef.current,
        projectilesRef.current,
        enemiesRef.current,
        actionsRef.current,
        sizeRef.current,
        dpr,
      );
      if (running) requestAnimationFrame(renderFrame);
    }
    renderFrame();
    return () => {
      running = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size.width}
      height={size.height}
      className="block w-full h-full"
    />
  );
}
