import type { JSX } from "react";
import { useRef, useEffect, useCallback, useState } from "react";
import { MapMakerEngine } from "../MapMakerEngine";
import { GridRenderer } from "./GridRenderer";
import { PreviewRenderer } from "./PreviewRenderer";

interface MapCanvasProps {
  engine: MapMakerEngine;
  width: number;
  height: number;
  className?: string;
}

export function MapCanvas({ engine, width, height, className }: MapCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gridRenderer = useRef<GridRenderer | null>(null);
  const previewRenderer = useRef<PreviewRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [cursorStyle, setCursorStyle] = useState<string>(getCurrentCursor(engine.getCurrentTool()));
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Setup canvas DPR scaling and notify engine of CSS size
  const setupCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, Math.floor(canvas.clientWidth || width));
    const cssHeight = Math.max(1, Math.floor(canvas.clientHeight || height));
    const backingWidth = Math.floor(cssWidth * dpr);
    const backingHeight = Math.floor(cssHeight * dpr);
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    // Keep CSS size consistent
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    engine.updateCanvasSize(cssWidth, cssHeight);
  }, [engine, width, height]);

  // Initialize renderers
  useEffect(() => {
    const mode = engine.getMode();
    const gridSize = mode === "ship" ? 16 : 32;

    gridRenderer.current = new GridRenderer({
      size: gridSize,
      color: "#333333",
      opacity: 0.3,
      majorLineInterval: 4,
      majorLineColor: "#555555",
      majorLineOpacity: 0.5,
    });

    previewRenderer.current = new PreviewRenderer();
  }, [engine]);

  // Set up canvas on engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      engine.setCanvas(canvas);
      setupCanvasSize();
      // Observe size changes
      if (typeof ResizeObserver !== "undefined") {
        const ro = new ResizeObserver(() => setupCanvasSize());
        ro.observe(canvas);
        resizeObserverRef.current = ro;
      } else {
        const onResize = (): void => setupCanvasSize();
        window.addEventListener("resize", onResize);
        return (): void => window.removeEventListener("resize", onResize);
      }
    }
    return (): void => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [engine, setupCanvasSize]);

  // Update grid size when mode changes
  useEffect(() => {
    const handleModeChange = (mode: "ship" | "planet"): void => {
      const gridSize = mode === "ship" ? 16 : 32;
      gridRenderer.current?.setConfig({ size: gridSize });
    };

    engine.on("modeChanged", handleModeChange);
    return (): void => engine.off("modeChanged", handleModeChange);
  }, [engine]);

  // Update cursor style when tool changes
  useEffect(() => {
    const handleToolChange = (): void => {
      setCursorStyle(getCurrentCursor(engine.getCurrentTool()));
    };
    engine.on("toolChanged", handleToolChange);
    return (): void => engine.off("toolChanged", handleToolChange);
  }, [engine]);

  // Render loop with performance optimizations
  const render = useCallback((): void => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    // Check if we should throttle rendering for performance
    if (engine.shouldThrottleRender()) {
      animationFrameRef.current = requestAnimationFrame(render);
      return;
    }

    // Update render time for throttling
    engine.updateRenderTime();

    // Performance optimization: Only clear dirty regions when possible
    // For now, clear the entire canvas but this could be optimized further
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = Math.max(1, Math.floor(canvas.clientWidth || width));
    const cssHeight = Math.max(1, Math.floor(canvas.clientHeight || height));
    // Reset and apply DPR transform
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = false;

    // Get camera state from engine
    const camera = engine.getCamera();

    // Batch canvas operations for better performance
    context.save();

    // Check if grid is visible at current zoom before rendering
    const isGridVisible = gridRenderer.current?.isGridVisible(camera.zoom) ?? false;
    if (isGridVisible) {
      gridRenderer.current?.render(context, camera, cssWidth, cssHeight);
    }

    // Render map content
    const project = engine.getProject();
    if (project) {
      previewRenderer.current?.render(context, project, camera, cssWidth, cssHeight);
    }

    // Render current tool preview
    const currentTool = engine.getCurrentTool();
    if (currentTool) {
      // Get preview data from engine for wall tool
      const previewData = currentTool.id === "wall" ? engine.getCurrentToolPreview() : null;
      previewRenderer.current?.renderToolPreview(context, currentTool, camera, previewData);
    }

    context.restore();

    // Continue animation loop
    animationFrameRef.current = requestAnimationFrame(render);
  }, [engine, width, height]);

  // Start render loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(render);

    return (): void => {
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Handle camera updates
  useEffect(() => {
    const handleCameraChange = (): void => {
      // Camera changes will trigger re-render through the animation loop
    };

    const handleProjectChange = (): void => {
      // Project changes will trigger re-render through the animation loop
    };

    engine.on("cameraChanged", handleCameraChange);
    engine.on("projectChanged", handleProjectChange);

    return (): void => {
      engine.off("cameraChanged", handleCameraChange);
      engine.off("projectChanged", handleProjectChange);
    };
  }, [engine]);

  // Cleanup effect for performance optimization
  useEffect(() => {
    return (): void => {
      // Cancel any pending animation frame
      if (animationFrameRef.current != null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Clean up engine resources
      engine.cleanup();
    };
  }, [engine]);

  // Handle mouse events for panning with middle mouse button
  const handleMouseDown = useCallback(
    (event: React.MouseEvent): void => {
      // Ensure the canvas receives focus for keyboard shortcuts
      const el = canvasRef.current;
      if (el) el.focus();

      if (event.button === 1) {
        // Middle mouse button
        event.preventDefault();

        let prevX = event.clientX;
        let prevY = event.clientY;

        const handleMouseMove = (moveEvent: MouseEvent): void => {
          const deltaX = moveEvent.clientX - prevX;
          const deltaY = moveEvent.clientY - prevY;
          prevX = moveEvent.clientX;
          prevY = moveEvent.clientY;
          engine.panCamera(-deltaX, -deltaY);
        };

        const handleMouseUp = (): void => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      }
    },
    [engine],
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      tabIndex={0}
      className={className}
      onMouseDown={handleMouseDown}
      style={{
        display: "block",
        cursor: cursorStyle,
      }}
    />
  );
}

function getCurrentCursor(tool: ReturnType<MapMakerEngine["getCurrentTool"]>): string {
  if (!tool) return "default";

  switch (tool.cursor) {
    case "brush":
      return "crosshair";
    case "crosshair":
      return "crosshair";
    case "hand":
      return "grab";
    case "select":
      return "default";
    default:
      return "default";
  }
}
