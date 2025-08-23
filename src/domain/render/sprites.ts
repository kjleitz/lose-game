// Module-level cache for the SVG image and loaded state
let shipImg: HTMLImageElement | null = null;
let shipImgLoaded = false;

export function drawShipTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
) {
  if (!shipImg) {
    shipImg = new window.Image();
    shipImg.src = "/src/assets/svg/ship.svg";
    shipImg.onload = () => {
      shipImgLoaded = true;
    };
  }
  if (shipImgLoaded && shipImg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(shipImg, -size / 2, -size / 2, size, size);
    ctx.restore();
  }
  // No fallback: only draw SVG if loaded
}

// Module-level cache for the thruster SVG image and loaded state
let thrusterImg: HTMLImageElement | null = null;
let thrusterImgLoaded = false;

export function drawThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  size = 24,
  power = 1,
) {
  if (!thrusterImg) {
    thrusterImg = new window.Image();
    thrusterImg.src = "/src/assets/svg/thruster.svg";
    thrusterImg.onload = () => {
      thrusterImgLoaded = true;
    };
  }
  if (thrusterImgLoaded && thrusterImg) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    // Optionally scale the SVG based on power
    const scale = 0.8 + 1.2 * power;
    ctx.drawImage(
      thrusterImg,
      (-size / 2) * scale,
      (-size / 2) * scale,
      size * scale,
      size * scale,
    );
    ctx.restore();
  }
  // No fallback: only draw SVG if loaded
}
