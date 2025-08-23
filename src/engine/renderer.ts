export interface Renderer {
  clear(): void;
}

export function createRenderer(ctx: CanvasRenderingContext2D): Renderer {
  return {
    clear() {
      const { canvas } = ctx;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    },
  };
}
