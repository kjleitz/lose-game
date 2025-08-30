import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Action<BB>(name: string, fn: (bb: BB, dt: number) => Status): Node<BB> {
  const id = uid(`act:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      return fn(bb, dt);
    },
  };
}
