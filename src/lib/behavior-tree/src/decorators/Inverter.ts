import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Inverter<BB>(name: string, child: Node<BB>): Node<BB> {
  const id = uid(`inv:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const s = child.tick(bb, dt);
      if (s === "Success") return "Failure";
      if (s === "Failure") return "Success";
      return s;
    },
  };
}
