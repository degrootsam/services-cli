import { jest } from "@jest/globals";
import { parseName, getValidFunctions } from "../src/utils/functions";
import type { Functions } from "../src/utils/functions/types";

describe("parseName", () => {
  it("converts kebab-case function name to camelCase", () => {
    expect(parseName("hello-world")).toBe("helloWorld");
  });

  it("leaves camelCase unchanged", () => {
    expect(parseName("helloWorld")).toBe("helloWorld");
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
    const result = getValidFunctions(functions);
    expect(Object.keys(result)).toEqual(["fn-a"]);
  });
});
