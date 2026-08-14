import { mock, describe, it, expect, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { bootstrapConfig } from "../utils/config/index.js";
import type { LoggerAPI } from "../utils/logger/index.js";
import type { DirectorAPI } from "../utils/director/index.js";
import type { PrompterAPI } from "../utils/prompter/index.js";
import type { StateAPI } from "../utils/state/index.js";

const makeDeps = () => ({
  director: {
    exists: mock(async () => false),
    readFile: mock(async () => ""),
    getTsConfig: mock(async () => null),
  } as Partial<DirectorAPI> as DirectorAPI,
  logger: {
    debug: mock(),
    error: mock(),
    info: mock(),
    warn: mock(),
    toggleVerbose: mock(),
    getValidationPrefix: mock(() => "√"),
    getValidationColor: mock(),
  } as LoggerAPI,
  prompter: {
    input: mock(),
  } as Partial<PrompterAPI> as PrompterAPI,
  state: {
    getState: mock(() => ({})),
    updateState: mock(),
    saveState: mock(),
  } as StateAPI,
});

describe("bootstrapConfig", () => {
  it("defaults srcDir to 'functions'", async () => {
    const config = await bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    expect(config.srcDir).toBe("functions");
  });

  it("uses .js extension when no tsconfig found", async () => {
    const config = await bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    expect(config.projectExtension).toBe(".js");
  });

  it("uses .ts extension when tsconfig found", async () => {
    const deps = makeDeps();
    (deps.director.getTsConfig as any).mockReturnValue({ compilerOptions: {} });
    const config = await bootstrapConfig({ opts: { force: false }, deps });
    expect(config.projectExtension).toBe(".ts");
  });

  it("updateConfig mutates the internal state", async () => {
    const config = await bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    config.updateConfig({ app: { uuid: "abc-123", identifier: "", zone: "" } });
    expect(config.app.uuid).toBe("abc-123");
  });

  it("force flag is exposed on the config object", async () => {
    const config = await bootstrapConfig({
      opts: { force: true },
      deps: makeDeps(),
    });
    expect(config.force).toBe(true);
  });

  it("fills gaps from .bbs/state.json", async () => {
    const deps = makeDeps();
    (deps.state.getState as any).mockReturnValue({
      app: { uuid: "state-uuid" },
    });
    const config = await bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("state-uuid");
  });

  it("legacy config.json overrides .bbs/state.json", async () => {
    const deps = makeDeps();
    (deps.state.getState as any).mockReturnValue({
      app: { uuid: "state-uuid" },
    });
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue(
      JSON.stringify({ app: { uuid: "legacy-uuid" } }),
    );
    const config = await bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("legacy-uuid");
  });

  it("falls back to defaults when config.json is malformed", async () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue("{not json");
    const config = await bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("");
    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("getAppUUID persists the resolved uuid to state", async () => {
    const deps = makeDeps();
    (deps.prompter.input as any).mockResolvedValue("prompted-uuid");
    const config = await bootstrapConfig({ opts: { force: false }, deps });
    const uuid = await config.getAppUUID();
    expect(uuid).toBe("prompted-uuid");
    expect(deps.state.updateState).toHaveBeenCalledWith({
      app: { uuid: "prompted-uuid" },
    });
  });

  describe("loadUserConfig", () => {
    let originalCwd: string;
    let tmpDir: string;

    afterEach(() => {
      if (tmpDir) {
        process.chdir(originalCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        tmpDir = "";
      }
    });

    it("skips silently when bbs.config.ts does not exist", async () => {
      const deps = makeDeps();
      const config = await bootstrapConfig({ opts: { force: false }, deps });
      expect(config.loadUserConfig()).resolves.toBeUndefined();
    });

    it("merges bbs.config.ts on top of every other layer", async () => {
      originalCwd = process.cwd();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-config-test-"));
      fs.writeFileSync(
        path.join(tmpDir, "bbs.config.ts"),
        `export default { app: { uuid: "file-uuid" } };\n`,
      );
      process.chdir(tmpDir);

      const deps = makeDeps();
      (deps.state.getState as any).mockReturnValue({
        app: { uuid: "state-uuid" },
      });
      const config = await bootstrapConfig({ opts: { force: false }, deps });
      (deps.director.exists as any).mockReturnValue(true);

      await config.loadUserConfig();

      expect(config.app.uuid).toBe("file-uuid");
    });

    it("throws when bbs.config.ts has no default export", async () => {
      originalCwd = process.cwd();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-config-test-"));
      fs.writeFileSync(
        path.join(tmpDir, "bbs.config.ts"),
        `export const notDefault = { app: {} };\n`,
      );
      process.chdir(tmpDir);

      const deps = makeDeps();
      (deps.director.exists as any).mockReturnValue(true);
      const config = await bootstrapConfig({ opts: { force: false }, deps });

      expect(config.loadUserConfig()).rejects.toThrow(
        "bbs.config.ts must have a default export from createConfig(...)",
      );
    });

    it("throws when bbs.config.ts throws during import", async () => {
      originalCwd = process.cwd();
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-config-test-"));
      fs.writeFileSync(
        path.join(tmpDir, "bbs.config.ts"),
        `throw new Error("boom");\n`,
      );
      process.chdir(tmpDir);

      const deps = makeDeps();
      (deps.director.exists as any).mockReturnValue(true);
      const config = await bootstrapConfig({ opts: { force: false }, deps });

      expect(config.loadUserConfig()).rejects.toThrow(
        "Failed to load bbs.config.ts",
      );
    });
  });
});
