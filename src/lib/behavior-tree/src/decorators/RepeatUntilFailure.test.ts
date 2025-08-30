import { describe, it, expect } from "vitest";
import { RepeatUntilFailure } from "./RepeatUntilFailure";
import { Action } from "../nodes/Action";

interface BB {}

describe("RepeatUntilFailure", () => {
  it("runs until failure or max attempts", () => {
    let calls = 0;
    const child = Action<BB>("flaky", () => {
      calls += 1;
      return calls >= 2 ? "Failure" : "Success";
    });
    const ruf = RepeatUntilFailure<BB>("ruf", child, 3);
    expect(ruf.tick({}, 0)).toBe("Running");
    expect(ruf.tick({}, 0)).toBe("Failure");
  });

  it("succeeds after max attempts of success", () => {
    const child = Action<BB>("alwaysSuccess", () => "Success");
    const ruf = RepeatUntilFailure<BB>("ruf", child, 2);
    expect(ruf.tick({}, 0)).toBe("Running");
    expect(ruf.tick({}, 0)).toBe("Success");
  });
});
