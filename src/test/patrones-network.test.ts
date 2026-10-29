import { describe, expect, it } from "vitest";
import { isPatronesConstrainedConnection } from "../lib/patronesNetwork";

describe("Patrones bandwidth hints", () => {
  it("avoids speculative downloads when data saving is enabled", () => {
    expect(isPatronesConstrainedConnection({ saveData: true, effectiveType: "4g" })).toBe(true);
  });
  it("treats 3G and slower networks as constrained", () => {
    for (const effectiveType of ["slow-2g", "2g", "3g"]) {
      expect(isPatronesConstrainedConnection({ effectiveType })).toBe(true);
    }
  });
  it("treats known low bandwidth as constrained", () => {
    expect(isPatronesConstrainedConnection({ effectiveType: "4g", downlink: 1.5 })).toBe(true);
    expect(isPatronesConstrainedConnection({ effectiveType: "4g", downlink: 2 })).toBe(false);
  });
  it("preserves normal quality without network hints", () => {
    expect(isPatronesConstrainedConnection()).toBe(false);
    expect(isPatronesConstrainedConnection({ effectiveType: "4g", downlink: 10 })).toBe(false);
  });
});