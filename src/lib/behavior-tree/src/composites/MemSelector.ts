import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

// Memory Selector: resumes from the running child index on subsequent ticks.
export function MemSelector<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`msel:${name}`);
  let index = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      while (index < children.length) {
        const status = children[index].tick(bb, dt);
        if (status === "Failure") {
          index += 1;
          continue;
        }
        if (status === "Running") return "Running";
        // Success: reset
        index = 0;
        return "Success";
      }
      // All failed: reset and fail
      index = 0;
      return "Failure";
    },
  };
}
