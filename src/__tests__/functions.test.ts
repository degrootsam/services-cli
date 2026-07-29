import { describe, it, expect } from "bun:test";
import { parseName } from "../utils/functions";
import { getValidFunctions } from "../utils/functions/validate";
import type { Functions } from "../utils/functions/types";

describe("parseName", () => {
  it("converts kebab-case function name to camelCase", () => {
    expect(parseName({ name: "hello-world" })).toBe("helloWorld");
  });

  it("leaves camelCase unchanged", () => {
    expect(parseName({ name: "helloWorld" })).toBe("helloWorld");
  });
});

describe("getValidFunctions", () => {
  const functions: Functions = {
    "fn-a": {
      fileType: "ts",
      latestVersion: "1.0",
      path: "",
      validation: {
        valid: true,
        info: { isAsync: true, isDefaultExport: true, matchesName: true },
      },
      versions: new Set(["1.0"]),
    },
    "fn-b": {
      fileType: "ts",
      latestVersion: "1.0",
      path: "",
      validation: {
        valid: false,
        info: { isAsync: false, isDefaultExport: false, matchesName: false },
      },
      versions: new Set(["1.0"]),
    },
  };

  it("returns only valid functions", () => {
    const result = getValidFunctions({ functions });
    expect(Object.keys(result)).toEqual(["fn-a"]);
  });
});
