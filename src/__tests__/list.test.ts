import { describe, it, expect, mock } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";
import { createLogger } from "../utils/logger/index.js";
import { formatFunctionList, listFunctions } from "../utils/functions/list.js";

const files: Record<string, string> = {
  "say-hello/1.0/index.js":
    "const sayHello = async () => ({ result: 'hi' });\nexport default sayHello;\n",
  "say-hello/1.1/index.js":
    "const sayHello = async () => ({ result: 'hi' });\nexport default sayHello;\n",
  "broken/1.0/index.js": "export const nope = 1;\n",
};

const deps = {
  logger: { ...createLogger(), debug: mock() },
  spinner: autoMock({ start() {}, success() {}, stop() {} }),
  config: { srcDir: "functions" },
  director: {
    getProjectType: mock(async () => "js"),
    readDir: mock(async () => Object.keys(files)),
    readFile: mock(
      async (filePath: string) => files[filePath.split("/functions/")[1]] ?? "",
    ),
  },
} as any;

describe("listFunctions", () => {
  it("lists every function with its versions and validation result", async () => {
    expect(await listFunctions({ deps })).toEqual([
      {
        name: "broken",
        latestVersion: "1.0",
        versions: ["1.0"],
        valid: false,
      },
      {
        name: "say-hello",
        latestVersion: "1.1",
        versions: ["1.1", "1.0"],
        valid: true,
      },
    ]);
  });
});

describe("formatFunctionList", () => {
  it("prints one aligned line per function", () => {
    const lines = formatFunctionList({
      deps,
      functions: [
        {
          name: "say-hello",
          latestVersion: "1.1",
          versions: ["1.1", "1.0"],
          valid: true,
        },
        {
          name: "broken",
          latestVersion: "1.0",
          versions: ["1.0"],
          valid: false,
        },
      ],
    }).map((line) => line.replace(/\x1b\[[0-9;]*m/g, ""));
    expect(lines).toEqual(["√ say-hello  1.1  (1.1, 1.0)", "x broken     1.0"]);
  });

  it("says so when there are no functions", () => {
    expect(formatFunctionList({ deps, functions: [] })).toEqual([
      "No functions found in functions",
    ]);
  });
});
