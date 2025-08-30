import { describe, it, expect } from "vitest";
import { Repeat } from "./Repeat";
import { Action } from "../nodes/Action";

interface BB {}

describe("Repeat", () => {
  it("returns Running until child completes N times, then Success", () => {
    let calls = 0;
    const child = Action<BB>("child", () => {
      calls += 1;
      return "Success";
    });
    const rep = Repeat<BB>("r", child, 3);
    expect(rep.tick({}, 0)).toBe("Running");
    expect(rep.tick({}, 0)).toBe("Running");
    expect(rep.tick({}, 0)).toBe("Success");
    expect(calls).toBe(3);
  });
});
