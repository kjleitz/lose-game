export interface Camera {
  x: number;
  y: number;
  zoom: number; // 1 = 1 world unit per pixel
}

export function createCamera(x = 0, y = 0, zoom = 1): Camera {
  return { x, y, zoom };
}

export function setCameraPosition(cam: Camera, x: number, y: number): void {
  cam.x = x;
  cam.y = y;
}

export function setCameraZoom(cam: Camera, zoom: number): void {
  cam.zoom = zoom;
}

// Computes a transform for CanvasRenderingContext2D#setTransform that
// centers the camera at (cam.x, cam.y) with the given viewport size and DPR.
export function cameraTransform(
  cam: Camera,
  viewportWidth: number,
  viewportHeight: number,
  dpr: number,
): [number, number, number, number, number, number] {
  const scale = dpr * cam.zoom;
  const tx = dpr * (viewportWidth / 2 - cam.x * cam.zoom);
  const ty = dpr * (viewportHeight / 2 - cam.y * cam.zoom);
  return [scale, 0, 0, scale, tx, ty];
}
