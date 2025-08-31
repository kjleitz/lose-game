import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Succeeder<BB>(name: string, child: Node<BB>): Node<BB> {
  const id = uid(`suc:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const status = child.tick(bb, dt);
      return status === "Running" ? "Running" : "Success";
    },
  };
}
