import type { Node, Status } from "../types";
import { uid } from "../internal/uid";

// Memory Sequence: resumes from the running child index on subsequent ticks.
export function MemSequence<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`mseq:${name}`);
  let index = 0;
  return {
    id,
    tick(bb: BB, dt: number): Status {
      while (index < children.length) {
        const s = children[index].tick(bb, dt);
        if (s === "Success") {
          index += 1;
          continue;
        }
        if (s === "Running") return "Running";
        // Failure: reset
        index = 0;
        return "Failure";
      }
      // Completed all children: reset and succeed
      index = 0;
      return "Success";
    },
  };
}
