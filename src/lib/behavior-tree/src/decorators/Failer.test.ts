import { describe, it, expect } from "vitest";
import { Failer } from "./Failer";
import { Action } from "../nodes/Action";

interface BB {
  [key: string]: unknown;
}

describe("Failer", () => {
  it("converts Success to Failure and preserves Running", () => {
    const ok = Action<BB>("ok", () => "Success");
    const run = Action<BB>("run", () => "Running");
    const f1 = Failer<BB>("f", ok);
    const f2 = Failer<BB>("f", run);
    expect(f1.tick({}, 0)).toBe("Failure");
    expect(f2.tick({}, 0)).toBe("Running");
  });
});
