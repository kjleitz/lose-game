import { describe, it, expect } from "vitest";
import { Succeeder } from "./Succeeder";
import { Action } from "../nodes/Action";

interface BB {
  [key: string]: unknown;
}

describe("Succeeder", () => {
  it("converts Failure to Success and preserves Running", () => {
    const fail = Action<BB>("fail", () => "Failure");
    const run = Action<BB>("run", () => "Running");
    const s1 = Succeeder<BB>("s", fail);
    const s2 = Succeeder<BB>("s", run);
    expect(s1.tick({}, 0)).toBe("Success");
    expect(s2.tick({}, 0)).toBe("Running");
  });
});
