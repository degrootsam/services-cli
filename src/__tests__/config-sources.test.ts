import { describe, it, expect, mock, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { autoMock } from "../__mocks__/utils.js";
import { bootstrapConfig } from "../utils/config/index.js";
import { flattenConfig, formatConfigEntries } from "../utils/config/sources.js";

describe("flattenConfig", () => {
  it("flattens nested objects to dotted keys, keeping arrays and skipping undefined", () => {
    expect(
      flattenConfig({ a: { b: 1, c: { d: "x" } }, e: [1, 2], f: undefined }),
    ).toEqual({ "a.b": 1, "a.c.d": "x", e: [1, 2] });
  });
});

describe("config sources", () => {
  const originalCwd = process.cwd();
  let tmpDir = "";

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("reports which layer set each value", async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-sources-"));
    fs.writeFileSync(
      path.join(tmpDir, "bbs.config.ts"),
      `export default { app: { identifier: "file-app" } };\n`,
    );
    process.chdir(tmpDir);

    const deps = {
      logger: autoMock({ debug() {}, error() {} }),
      prompter: {},
      director: {
        exists: mock(async () => true),
        readFile: mock(async () => JSON.stringify({ app: { zone: "eu" } })),
        getTsConfig: mock(async () => null),
      },
      state: {
        getState: mock(() => ({ app: { uuid: "state-uuid" } })),
        updateState: mock(),
        saveState: mock(),
      },
    } as any;
    const config = await bootstrapConfig({
      opts: { env: { BBS_ENV: "acceptance" } },
      deps,
    });
    await config.loadUserConfig();

    const entries = Object.fromEntries(
      config.getConfigEntries().map((e) => [e.key, [e.value, e.source]]),
    );
    expect(entries["app.uuid"]).toEqual(["state-uuid", ".bbs/state.json"]);
    expect(entries["app.zone"]).toEqual(["eu", "config.json"]);
    expect(entries["app.identifier"]).toEqual(["file-app", "bbs.config.ts"]);
    expect(entries["options.env"]).toEqual(["acceptance", "environment"]);
    expect(entries["options.appDomain"]).toEqual(["betty.app", "default"]);
  });
});

describe("formatConfigEntries", () => {
  it("aligns keys and shows the source of each value", () => {
    expect(
      formatConfigEntries([
        { key: "app.uuid", value: "abc", source: "bbs.config.ts" },
        { key: "options.https", value: true, source: "default" },
      ]),
    ).toEqual([
      'app.uuid      = "abc"  (bbs.config.ts)',
      "options.https = true  (default)",
    ]);
  });
});
