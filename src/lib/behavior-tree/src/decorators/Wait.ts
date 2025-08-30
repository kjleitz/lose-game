import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

// Delay ticking the child until a duration has elapsed.
// Before the delay elapses, returns Running. Afterward, delegates to child.
export function Wait<BB>(name: string, child: Node<BB>, durationSeconds: number): Node<BB> {
  const id = uid(`wait:${name}`);
  let elapsed = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      if (elapsed < durationSeconds) {
        elapsed += dt;
        if (elapsed < durationSeconds) return "Running";
      }
      const s = child.tick(bb, dt);
      if (s === "Running") return "Running";
      // Reset timer on terminal child status so it can be reused
      elapsed = 0;
      return s;
    },
  };
}
