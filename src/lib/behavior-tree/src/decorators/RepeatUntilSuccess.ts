import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

export function RepeatUntilSuccess<BB>(
  name: string,
  child: Node<BB>,
  maxAttempts?: number,
): Node<BB> {
  const id = uid(`rus:${name}`);
  let attempts = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const s = child.tick(bb, dt);
      if (s === "Success") {
        attempts = 0;
        return "Success";
      }
      if (s === "Running") return "Running";
      attempts += 1;
      if (typeof maxAttempts === "number" && attempts >= maxAttempts) {
        attempts = 0;
        return "Failure";
      }
      return "Running";
    },
  };
}
