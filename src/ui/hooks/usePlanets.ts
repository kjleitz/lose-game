import { useRef, useState } from "react";
import { PlanetManager } from "../../domain/game/planetManager";
import type { Planet } from "../../domain/game/planets";

export function usePlanets(
  size: { width: number; height: number },
  initialCenter: { x: number; y: number } = { x: 0, y: 0 },
) {
  const managerRef = useRef<PlanetManager>(new PlanetManager(size, initialCenter));
  const [planets, setPlanets] = useState<Planet[]>(managerRef.current.getPlanets());

  function maybeGenerateRegion(center: { x: number; y: number }, regionKey: string, count = 4) {
    managerRef.current.maybeGenerateRegion(center, regionKey, count, size);
    setPlanets([...managerRef.current.getPlanets()]);
  }

  return { planets, setPlanets, maybeGenerateRegion };
}
