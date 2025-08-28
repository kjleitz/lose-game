import type { PlanetSurface } from "./types";
import type { Biome } from "../../../shared/types/Biome";
import { createSeededRng, hashStringToInt } from "../../../shared/utils";

export function generatePlanetSurfaceFor(planet: { id: string; radius: number }): PlanetSurface {
  const landingSite = { x: 0, y: 0 };
  const terrain: PlanetSurface["terrain"] = [];
  const resources: PlanetSurface["resources"] = [];
  const creatures: PlanetSurface["creatures"] = [];
  const waterBodies: NonNullable<PlanetSurface["waterBodies"]> = [];
  const biome = pickBiome(planet.id);
  const rng = createSeededRng(hashStringToInt(planet.id));

  const baseFeatures =
    biome === "rainforest" ? 35 : biome === "fields" ? 18 : biome === "desert" ? 12 : 20;
  const features = baseFeatures + rng.int(0, Math.floor(baseFeatures * 0.25));
  for (let i = 0; i < features; i++) {
    const angle = rng.float(0, Math.PI * 2);
    const distance = 80 + rng.float(0, 320);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const type: PlanetSurface["terrain"][number]["type"] =
      biome === "desert"
        ? rng.next() > 0.2
          ? "rock"
          : "vegetation"
        : biome === "rainforest"
          ? rng.next() > 0.15
            ? "vegetation"
            : "rock"
          : rng.next() > 0.5
            ? "rock"
            : "vegetation";
    terrain.push({
      id: `terrain-${i}`,
      x,
      y,
      type,
      size: 18 + rng.float(0, biome === "rainforest" ? 40 : 28),
    });
  }

  const baseRes = biome === "desert" ? 10 : biome === "rainforest" ? 8 : 6;
  const resCount = baseRes + rng.int(0, Math.floor(baseRes * 0.3));
  const resTypes: Array<PlanetSurface["resources"][number]["type"]> =
    biome === "desert"
      ? ["mineral", "energy", "mineral"]
      : biome === "rainforest"
        ? ["organic", "organic", "energy"]
        : biome === "archipelago"
          ? ["energy", "organic", "mineral"]
          : ["mineral", "energy", "organic"];
  for (let i = 0; i < resCount; i++) {
    const angle = rng.float(0, Math.PI * 2);
    const distance = 50 + rng.float(0, 240);
    const x = Math.cos(angle) * distance;
    const y = Math.sin(angle) * distance;
    const type = resTypes[rng.int(0, resTypes.length - 1)];
    resources.push({ id: `resource-${i}`, x, y, type, amount: rng.int(12, 60) });
  }

  addWaterBodies(rng, biome, waterBodies);

  return { planetId: planet.id, landingSite, terrain, resources, creatures, biome, waterBodies };
}

function pickBiome(planetId: string): Biome {
  const options: ReadonlyArray<Biome> = ["rainforest", "fields", "desert", "archipelago"];
  const idx = hashStringToInt(planetId) % options.length;
  return options[idx];
}

function addWaterBodies(
  rng: ReturnType<typeof createSeededRng>,
  biome: Biome,
  out: NonNullable<PlanetSurface["waterBodies"]>,
): void {
  const add = (count: number, baseR: number, jitter: number): void => {
    for (let i = 0; i < count; i++) {
      const angle = rng.float(0, Math.PI * 2);
      const dist = 120 + rng.float(0, 600);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const rx = baseR + rng.float(-jitter, jitter);
      const ry = baseR * rng.float(0.6, 1) + rng.float(-jitter * 0.4, jitter * 0.4);
      const rotation = rng.float(0, Math.PI);
      out.push({ id: `water-${i}-${Math.floor(dist)}`, x, y, rx, ry, rotation });
    }
  };

  if (biome === "archipelago") add(6 + rng.int(2, 4), 260, 90);
  else if (biome === "rainforest") add(3 + rng.int(0, 2), 180, 60);
  else if (biome === "fields") add(2 + rng.int(0, 2), 140, 50);
  else if (biome === "desert") add(1 + rng.int(0, 1), 100, 30);
}
