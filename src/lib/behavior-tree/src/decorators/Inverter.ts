import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Inverter<BB>(name: string, child: Node<BB>): Node<BB> {
  const id = uid(`inv:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const status = child.tick(bb, dt);
      if (status === "Success") return "Failure";
      if (status === "Failure") return "Success";
      return status;
    },
  };
}
