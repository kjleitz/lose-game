import { createJsonCodec, createStore, detectBackend } from "..";

interface Vec2 { x: number; y: number }

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const vec2Codec = createJsonCodec<Vec2>((u) => {
  if (isRecord(u)) {
    const x = u["x"];
    const y = u["y"];
    if (typeof x === "number" && typeof y === "number") return { x, y };
  }
  throw new Error("Invalid Vec2");
});

const positions = createStore<Vec2>({
  namespace: "positions",
  backend: detectBackend(),
  codec: vec2Codec,
});
positions.set("player", { x: 10, y: 20 });
console.log("player pos:", positions.get("player"));
