import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function Parallel<BB>(
  name: string,
  children: Node<BB>[],
  options?: { successThreshold?: number; failureThreshold?: number },
): Node<BB> {
  const id = uid(`par:${name}`);
  const successThreshold = options?.successThreshold ?? children.length;
  const failureThreshold = options?.failureThreshold ?? 1;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      let success = 0;
      let failure = 0;
      for (const c of children) {
        const s = c.tick(bb, dt);
        if (s === "Success") success += 1;
        else if (s === "Failure") failure += 1;
      }
      if (success >= successThreshold) return "Success";
      if (failure >= failureThreshold) return "Failure";
      return "Running";
    },
  };
}
