import type { InteractiveStation } from "../game/ship-interior/types";

type StationType = InteractiveStation["type"];

interface StationVisual {
  shape: "triangle" | "diamond" | "square" | "hex" | "circle";
  fill: string;
  stroke: string;
  glow: string;
  text: string;
  label: string;
}

const STATION_VISUALS: Record<StationType, StationVisual> = {
  pilot_console: {
    shape: "triangle",
    fill: "#1f6feb",
    stroke: "#a5d6ff",
    glow: "rgba(65, 132, 247, 0.7)",
    text: "P",
    label: "Pilot",
  },
  cargo_terminal: {
    shape: "square",
    fill: "#9c4221",
    stroke: "#ffb089",
    glow: "rgba(250, 135, 60, 0.6)",
    text: "C",
    label: "Cargo",
  },
  engine_controls: {
    shape: "hex",
    fill: "#d97706",
    stroke: "#ffebb5",
    glow: "rgba(255, 196, 71, 0.6)",
    text: "E",
    label: "Engine",
  },
  navigation: {
    shape: "diamond",
    fill: "#22c55e",
    stroke: "#b7ffcd",
    glow: "rgba(84, 214, 123, 0.6)",
    text: "N",
    label: "Nav",
  },
  life_support: {
    shape: "circle",
    fill: "#0ea5e9",
    stroke: "#a5efff",
    glow: "rgba(14, 165, 233, 0.7)",
    text: "LS",
    label: "Life",
  },
} as const;

interface StationGlyphOptions {
  size?: number;
  includeLabel?: boolean;
  labelPosition?: "inside" | "below";
}

export function getStationVisual(type: StationType): StationVisual {
  return STATION_VISUALS[type];
}

export function renderStationGlyph(
  context: CanvasRenderingContext2D,
  station: InteractiveStation,
  options: StationGlyphOptions = {},
): void {
  const visual = STATION_VISUALS[station.type];

  const size = options.size ?? Math.max(12, station.radius * 0.75);
  const includeLabel = options.includeLabel ?? false;
  const labelPosition = options.labelPosition ?? "inside";

  context.save();
  context.translate(station.x, station.y);

  context.shadowColor = visual.glow;
  context.shadowBlur = 8;

  context.fillStyle = visual.fill;
  context.strokeStyle = visual.stroke;
  context.lineWidth = Math.max(1.5, size * 0.15);

  drawStationShape(context, visual.shape, size);
  context.fill();
  context.stroke();

  context.shadowBlur = 0;

  drawStationDetail(context, station.type, size, visual);

  if (includeLabel) {
    context.fillStyle = visual.text;
    const fontSize = Math.max(11, Math.floor(size * (labelPosition === "inside" ? 0.7 : 0.5)));
    context.font = `600 ${fontSize}px "Rajdhani", "Arial", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = labelPosition === "inside" ? "middle" : "top";
    const textY = labelPosition === "inside" ? 0 : size + 6;
    context.fillText(visual.text, 0, textY);
  }

  context.restore();
}

function drawStationShape(
  context: CanvasRenderingContext2D,
  shape: StationVisual["shape"],
  size: number,
): void {
  context.beginPath();
  switch (shape) {
    case "triangle": {
      context.moveTo(0, -size);
      context.lineTo(size * 0.9, size * 0.8);
      context.lineTo(-size * 0.9, size * 0.8);
      context.closePath();
      break;
    }
    case "diamond": {
      context.moveTo(0, -size);
      context.lineTo(size, 0);
      context.lineTo(0, size);
      context.lineTo(-size, 0);
      context.closePath();
      break;
    }
    case "square": {
      const half = size * 0.9;
      context.rect(-half, -half, half * 2, half * 2);
      break;
    }
    case "hex": {
      const steps = 6;
      const radius = size * 0.95;
      for (let i = 0; i < steps; i++) {
        const angle = ((Math.PI * 2) / steps) * i - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      break;
    }
    case "circle":
    default: {
      context.arc(0, 0, size * 0.9, 0, Math.PI * 2);
      break;
    }
  }
}

function drawStationDetail(
  context: CanvasRenderingContext2D,
  type: StationType,
  size: number,
  visual: StationVisual,
): void {
  context.save();
  context.lineWidth = Math.max(1, size * 0.12);
  context.strokeStyle = visual.stroke;
  context.fillStyle = visual.stroke;

  switch (type) {
    case "pilot_console": {
      context.beginPath();
      context.moveTo(-size * 0.45, size * 0.2);
      context.lineTo(size * 0.45, size * 0.2);
      context.lineTo(0, size * 0.75);
      context.closePath();
      context.fill();

      context.beginPath();
      context.moveTo(0, -size * 0.65);
      context.lineTo(0, size * 0.15);
      context.stroke();
      break;
    }
    case "cargo_terminal": {
      const half = size * 0.7;
      context.beginPath();
      context.rect(-half, -half, half * 2, half * 2);
      context.stroke();

      context.beginPath();
      context.moveTo(-half, 0);
      context.lineTo(half, 0);
      context.moveTo(0, -half);
      context.lineTo(0, half);
      context.stroke();
      break;
    }
    case "engine_controls": {
      const spokes = 4;
      for (let i = 0; i < spokes; i++) {
        const angle = (Math.PI / spokes) * i;
        const x = Math.cos(angle) * size * 0.8;
        const y = Math.sin(angle) * size * 0.8;
        context.beginPath();
        context.moveTo(-x, -y);
        context.lineTo(x, y);
        context.stroke();
      }
      break;
    }
    case "navigation": {
      context.beginPath();
      context.arc(0, 0, size * 0.25, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      context.stroke();

      context.beginPath();
      context.moveTo(0, -size * 0.9);
      context.lineTo(0, size * 0.9);
      context.moveTo(-size * 0.9, 0);
      context.lineTo(size * 0.9, 0);
      context.stroke();
      break;
    }
    case "life_support": {
      context.beginPath();
      context.arc(0, 0, size * 0.6, 0, Math.PI * 2);
      context.stroke();

      context.beginPath();
      context.moveTo(0, -size * 0.5);
      context.lineTo(0, size * 0.5);
      context.moveTo(-size * 0.5, 0);
      context.lineTo(size * 0.5, 0);
      context.stroke();
      break;
    }
  }

  context.restore();
}
