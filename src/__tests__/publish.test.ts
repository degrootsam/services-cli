import { describe, it, expect, mock, beforeEach, afterAll } from "bun:test";
import path from "path";
import { autoMock } from "../__mocks__/utils.js";
// Real modules first, so the mocks below only replace what this test needs
import * as realBuildModule from "../utils/functions/build.js";
import * as realBarrelModule from "../utils/functions/gen/barrel.js";
import * as realUploadModule from "../utils/functions/upload.js";
import * as realValidateModule from "../utils/functions/validate.js";
import * as realGetModule from "../utils/functions/get.js";

// Copy the real exports now: the namespaces are live and will point at the mocks
const realBuild = { ...realBuildModule };
const realBarrel = { ...realBarrelModule };
const realUpload = { ...realUploadModule };
const realValidate = { ...realValidateModule };
const realGet = { ...realGetModule };

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

// Module mocks are process-wide: put the real modules back for other files
afterAll(() => {
  mock.module("../utils/functions/build.js", () => ({ ...realBuild }));
  mock.module("../utils/functions/gen/barrel.js", () => ({ ...realBarrel }));
  mock.module("../utils/functions/upload.js", () => ({ ...realUpload }));
  mock.module("../utils/functions/validate.js", () => ({ ...realValidate }));
  mock.module("../utils/functions/get.js", () => ({ ...realGet }));
});

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

  it("stops before logging in and uploading on a dry run", async () => {
    const deps = makeDeps();
    await publishFunctions({ deps, dryRun: true });

    expect(calls).toEqual(["barrel", "build", "zip", "removeDir"]);
    const output = deps.logger.info.mock.calls.flat().join("\n");
    expect(output).toContain(path.resolve("out", "app.zip"));
    expect(output).toContain("say-hello 1.0");
  });
});
