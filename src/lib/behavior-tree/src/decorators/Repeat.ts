import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Repeat<BB>(name: string, child: Node<BB>, times: number): Node<BB> {
  const id = uid(`rep:${name}`);
  let count = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      if (count >= times) return "Success";
      const s = child.tick(bb, dt);
      if (s === "Running") return "Running";
      count += 1;
      return count >= times ? "Success" : "Running";
    },
  };
}
