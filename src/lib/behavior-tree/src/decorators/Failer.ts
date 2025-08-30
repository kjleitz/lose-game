import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Failer<BB>(name: string, child: Node<BB>): Node<BB> {
  const id = uid(`fail:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const s = child.tick(bb, dt);
      return s === "Running" ? "Running" : "Failure";
    },
  };
}
