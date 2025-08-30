import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Condition<BB>(name: string, fn: (bb: BB) => boolean): Node<BB> {
  const id = uid(`cond:${name}`);
  return {
    id,
    tick(bb: BB): Status {
      return fn(bb) ? "Success" : "Failure";
    },
  };
}
