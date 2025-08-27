import { useRef, useState } from "react";
import { PlanetManager } from "../../domain/game/planetManager";
import type { Planet } from "../../domain/game/planets";
import type { ViewSize, Point2D } from "../../shared/types/geometry";

export interface UsePlanetsResult {
  planets: Planet[];
  setPlanets: React.Dispatch<React.SetStateAction<Planet[]>>;
  maybeGenerateRegion: (center: Point2D, regionKey: string, count?: number) => void;
}

export function usePlanets(
  size: ViewSize,
  initialCenter: Point2D = { x: 0, y: 0 },
): UsePlanetsResult {
  const managerRef = useRef<PlanetManager>(new PlanetManager(size, initialCenter));
  const [planets, setPlanets] = useState<Planet[]>(managerRef.current.getPlanets());

  function maybeGenerateRegion(center: Point2D, regionKey: string, count = 16): void {
    managerRef.current.maybeGenerateRegion(center, regionKey, count, size);
    setPlanets([...managerRef.current.getPlanets()]);
  }

  return { planets, setPlanets, maybeGenerateRegion };
}
