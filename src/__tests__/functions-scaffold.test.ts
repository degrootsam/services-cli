import { describe, it, expect, mock, beforeEach } from "bun:test";
import path from "path";
import { autoMock } from "../__mocks__/utils.js";

const existingFunctions = {
  "say-hello": {
    fileType: "ts",
    latestVersion: "1.0",
    path: "/project/functions/say-hello",
    versions: new Set(["1.0"]),
  },
};

mock.module("../utils/functions/get.js", () => ({
  getFunctions: mock(async () => existingFunctions),
}));
const generateTest = mock(async () => "");
mock.module("../utils/functions/gen/test.js", () => ({ generateTest }));
mock.module("../utils/scaffolder/index.js", () => ({
  downloadTemplate: mock(async () => ""),
}));
mock.module("../utils/functions/gen/config.js", () => ({
  generateBbsConfigFile: mock(async () => {}),
}));

const { createFunction } = await import("../utils/functions/create.js");
const { bumpFunction } = await import("../utils/functions/bump.js");
const { initFunctionsProject } = await import("../utils/functions/init.js");

const makeDeps = () =>
  ({
    logger: autoMock({ debug() {}, error() {}, info() {}, warn() {} }),
    spinner: autoMock({ start() {}, success() {}, update() {} }),
    prompter: {
      select: mock(async (choices: { value: string }[]) => choices[0].value),
      confirm: mock(async () => true),
      input: mock(async () => ""),
    },
    director: {
      getProjectType: mock(async () => "ts"),
      copyDir: mock(async () => {}),
      changeDir: mock(() => {}),
      runCommand: mock(async () => ""),
    },
    config: {
      force: false,
      srcDir: "functions",
      scaffolder: {
        templates: {
          functions: { project: { ts: { url: "https://example.com/ts" } } },
        },
      },
    },
  }) as any;

describe("createFunction", () => {
  it("rejects when the function already exists", async () => {
    await expect(
      createFunction({ deps: makeDeps(), name: "say-hello" }),
    ).rejects.toThrow("Function say-hello already exists!");
  });
});

describe("bumpFunction", () => {
  beforeEach(() => generateTest.mockClear());

  it("defaults to the minor version", async () => {
    const deps = makeDeps();
    await bumpFunction({ deps });
    const [choices, , def] = deps.prompter.select.mock.calls[1];
    expect(def).toBe("1.1");
    expect(choices.map((c: { value: string }) => c.value)).toContain(def);
  });

  it("generates the test for the new version", async () => {
    await bumpFunction({ deps: makeDeps() });
    const [{ func }] = generateTest.mock.calls[0] as any;
    expect(func.latestVersion).toBe("1.1");
    expect(existingFunctions["say-hello"].latestVersion).toBe("1.0");
  });
});

describe("initFunctionsProject", () => {
  it("installs dependencies inside the new project, not in name/name", async () => {
    const deps = makeDeps();
    await initFunctionsProject({ deps, name: "my-project", type: "ts" });
    const [, , options] = deps.director.runCommand.mock.calls[0];
    expect(options.cwd).not.toBe(path.resolve("my-project"));
  });
});
