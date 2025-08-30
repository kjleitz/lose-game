import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Selector<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`sel:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Failure") return s;
      }
      return "Failure";
    },
  };
}
