import type { JSX } from "react";
import type { Action } from "../../../application/input/ActionTypes";

export function ActionReadout({ actions }: { actions: Set<Action> }): JSX.Element {
  const text = actions.size ? Array.from(actions).join(", ") : "idle";
  return <div className="hud-text text-xs opacity-80">{text}</div>;
}
