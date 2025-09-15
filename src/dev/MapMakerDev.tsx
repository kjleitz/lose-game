import type { JSX } from "react";
import { MapMaker } from "../tools/map-maker/MapMaker";

export function MapMakerDev(): JSX.Element {
  return (
    <div className="w-screen h-screen bg-gray-900">
      <MapMaker />
    </div>
  );
}
