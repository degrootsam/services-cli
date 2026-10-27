import { describe, it, expect, mock } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";
import { getFunctionsJSON } from "../utils/functions/get.js";

describe("getFunctionsJSON", () => {
  it("resolves every function.json before returning", async () => {
    const deps = {
      logger: autoMock({ debug() {}, error() {} }),
      director: {
        readFile: mock(async () =>
          JSON.stringify({ label: "Say hello", options: [] }),
        ),
      },
    } as any;
    const functions = {
      "say-hello": {
        fileType: "ts",
        latestVersion: "1.0",
        path: "/project/functions/say-hello",
        versions: new Set(["1.0"]),
      },
    } as any;

    const result = await getFunctionsJSON({ deps, functions });

    expect(JSON.parse(JSON.stringify(result))).toEqual([
      {
        label: "Say hello",
        options: "[]",
        paths: "{}",
        name: "say-hello",
        version: "1.0",
      },
    ]);
  });
});
