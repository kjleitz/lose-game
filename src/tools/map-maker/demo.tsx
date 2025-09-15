import type { JSX } from "react";
import { MapMaker } from "./MapMaker";

export function MapMakerDemo(): JSX.Element {
  return (
    <div className="w-full h-screen bg-gray-900">
      <MapMaker />
    </div>
  );
}
