import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function RepeatUntilFailure<BB>(
  name: string,
  child: Node<BB>,
  maxAttempts?: number,
): Node<BB> {
  const id = uid(`ruf:${name}`);
  let attempts = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const s = child.tick(bb, dt);
      if (s === "Failure") {
        attempts = 0;
        return "Failure";
      }
      if (s === "Running") return "Running";
      attempts += 1;
      if (typeof maxAttempts === "number" && attempts >= maxAttempts) {
        attempts = 0;
        return "Success";
      }
      return "Running";
    },
  };
}
