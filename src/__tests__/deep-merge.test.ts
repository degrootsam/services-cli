import { describe, it, expect } from "bun:test";
import { deepMerge } from "../utils/deep-merge.js";

describe("deepMerge", () => {
  it("merges nested objects", () => {
    const result = deepMerge(
      { a: { b: 1, c: 2 }, d: 1 },
      { a: { c: 3 }, e: 4 },
    );
    expect(result).toEqual({ a: { b: 1, c: 3 }, d: 1, e: 4 });
  });

  it("replaces arrays instead of merging them", () => {
    expect(deepMerge({ a: [1, 2] }, { a: [3] })).toEqual({ a: [3] });
  });

  it("creates missing nested targets", () => {
    expect(deepMerge({}, { a: { b: { c: 1 } } })).toEqual({
      a: { b: { c: 1 } },
    });
  });
});
