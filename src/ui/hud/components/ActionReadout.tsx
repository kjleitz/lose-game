import type { JSX } from "react";
import type { Action } from "../../../application/input/ActionTypes";

interface ActionReadoutProps {
  actions: Set<Action>;
}

export function ActionReadout({ actions }: ActionReadoutProps): JSX.Element {
  return (
    <div className="hud-text text-xs opacity-80">{Array.from(actions).join(", ") || "idle"}</div>
  );
}
