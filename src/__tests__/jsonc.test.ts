import { describe, it, expect } from "bun:test";
import { parseJsonc } from "../utils/director/jsonc.js";

describe("parseJsonc", () => {
  it("removes line and block comments", () => {
    const content = `{
      /* block
         comment */
      "a": 1, // trailing comment
      /** doc */ "b": 2
    }`;
    expect(parseJsonc(content)).toEqual({ a: 1, b: 2 });
  });

  it("keeps comment-like text inside strings", () => {
    const content = `{
      "$schema": "https://json.schemastore.org/tsconfig",
      "glob": "src/**/*",
      "quote": "say \\"hi\\" // not a comment"
    }`;
    expect(parseJsonc(content)).toEqual({
      $schema: "https://json.schemastore.org/tsconfig",
      glob: "src/**/*",
      quote: 'say "hi" // not a comment',
    });
  });

  it("allows trailing commas", () => {
    expect(parseJsonc(`{ "a": [1, 2,], "b": { "c": 3, }, }`)).toEqual({
      a: [1, 2],
      b: { c: 3 },
    });
  });

  it("allows a trailing comma followed by a comment", () => {
    expect(parseJsonc(`{ "a": 1, // last\n /* end */ }`)).toEqual({ a: 1 });
  });
});
