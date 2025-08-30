import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Sequence<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`seq:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Success") return s;
      }
      return "Success";
    },
  };
}
