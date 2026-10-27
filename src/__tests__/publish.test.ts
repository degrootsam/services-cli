import { describe, it, expect, mock, beforeEach } from "bun:test";
import path from "path";
import { autoMock } from "../__mocks__/utils.js";
// Real modules first, so the mocks below only replace what this test needs
import * as realBuild from "../utils/functions/build.js";
import * as realBarrel from "../utils/functions/gen/barrel.js";
import * as realUpload from "../utils/functions/upload.js";
import * as realValidate from "../utils/functions/validate.js";
import * as realGet from "../utils/functions/get.js";

const calls: string[] = [];
const later = (name: string, result?: any) =>
  mock(async (..._args: any[]) => {
    await new Promise((resolve) => setTimeout(resolve, 5));
    calls.push(name);
    return result;
  });

const fn = {
  "say-hello": {
    fileType: "js",
    latestVersion: "1.0",
    path: "/project/functions/say-hello",
    versions: new Set(["1.0"]),
    validation: { valid: true, info: {} },
  },
};
const buildFunctions = later("build", ".tmp");
const generateFunctionsBarrelFile = later("barrel");
const uploadFunctions = later("upload");
mock.module("../utils/functions/build.js", () => ({
  ...realBuild,
  buildFunctions,
}));
mock.module("../utils/functions/gen/barrel.js", () => ({
  ...realBarrel,
  generateFunctionsBarrelFile,
}));
mock.module("../utils/functions/upload.js", () => ({
  ...realUpload,
  uploadFunctions,
}));
mock.module("../utils/functions/validate.js", () => ({
  ...realValidate,
  validateFunctions: mock(async () => fn),
}));
mock.module("../utils/functions/get.js", () => ({
  ...realGet,
  getFunctions: mock(async () => fn),
}));

const { publishFunctions } = await import("../utils/functions/publish.js");

const makeDeps = () =>
  ({
    logger: autoMock({ debug() {}, error() {}, info() {}, warn() {} }),
    spinner: autoMock({ start() {}, success() {} }),
    director: {
      getProjectType: mock(async () => "js"),
      zipDir: later("zip"),
      removeDir: later("removeDir"),
    },
    config: { buildDir: "out" },
  }) as any;

describe("publishFunctions", () => {
  beforeEach(() => {
    calls.length = 0;
  });

  it("writes the barrel file before building, all in the configured buildDir", async () => {
    const deps = makeDeps();
    await publishFunctions({ deps });

    expect(calls).toEqual(["barrel", "build", "zip", "removeDir", "upload"]);
    const [{ outdir }] = buildFunctions.mock.calls.at(-1) as any;
    expect(outdir).toBe("out");
    const [, zipPath] = deps.director.zipDir.mock.calls[0];
    expect(zipPath).toBe(path.resolve("out", "app.zip"));
  });
});
