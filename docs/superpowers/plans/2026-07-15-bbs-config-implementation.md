# bbs.config.ts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generated, auto-rewritten `config.json` with a user-authored `bbs.config.ts` (exporting `createConfig(...)`), while keeping legacy `config.json` readable-but-read-only, and moving CLI-owned runtime state (resolved app identity, template version pins) to a new `.bbs/state.json`.

**Architecture:** A new `state` module owns `.bbs/state.json` (the only file the CLI auto-writes). The `config` module's bootstrap constructor (renamed `bootstrapConfig`, since the name `createConfig` is now taken by the new public helper) merges `DEFAULT_CONFIG < .bbs/state.json < config.json (legacy) < bbs.config.ts`, the last loaded via a native dynamic `import()` once the CLI moves to run under Bun. A new public `createConfig` identity helper (Vite-`defineConfig` style) is exported from a new library entry point (`src/config.ts` / package `main`) so `bbs.config.ts` can `import { createConfig } from "bbs-cli"`.

**Tech Stack:** TypeScript, Bun (runtime + `bun:test`), esbuild (unchanged, used elsewhere), Commander.js.

## Global Constraints

- Never write to `config.json` or `bbs.config.ts` — only `.bbs/state.json` is CLI-writable.
- Merge order (later wins): `DEFAULT_CONFIG < .bbs/state.json < config.json < bbs.config.ts`.
- `bbs.config.ts` is optional; missing file → skip layer. Present-but-invalid (throws, or no valid `default` export) → hard error, abort.
- `config.json` and `.bbs/state.json` keep today's soft-fail behavior on malformed JSON: log + skip layer, don't crash.
- `createConfig`'s public type (`BbsUserConfig`) covers only `app`, `options`, `buildOptions` — never `scaffolder`.
- Follow existing code style: no comments unless explaining non-obvious _why_, small local `deepMerge` helpers duplicated per-module (matches existing precedent of two copies already in the codebase), getter-based API objects.

---

### Task 1: `.bbs/state.json` state module

**Files:**

- Create: `src/utils/state/index.ts`
- Test: `src/__tests__/state.test.ts`

**Interfaces:**

- Produces: `createState({ deps: { director: DirectorAPI; logger: LoggerAPI } }): StateAPI`, where `StateAPI = { getState: () => StateData; updateState: (partial: DeepPartial<StateData>) => void; saveState: () => void }`, and `StateData = { app?: Partial<Config["app"]>; scaffolder?: { templates?: { versions?: NonNullable<Config["scaffolder"]["templates"]["versions"]> } } }`. Later tasks import `StateAPI`, `StateData`, and `createState` from `../state` (relative to `src/utils/*`).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/state.test.ts`:

```ts
import { mock, describe, it, expect } from "bun:test";
import path from "path";
import { createState } from "../utils/state";
import type { LoggerAPI } from "../utils/logger";
import type { DirectorAPI } from "../utils/director";

const makeDeps = () => ({
  director: {
    exists: mock(() => false),
    readFile: mock(() => ""),
    writeFile: mock(),
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
});

describe("createState", () => {
  it("starts empty when .bbs/state.json does not exist", () => {
    const state = createState({ deps: makeDeps() });
    expect(state.getState()).toEqual({});
  });

  it("loads existing state.json content", () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue(
      JSON.stringify({ app: { uuid: "abc-123" } }),
    );
    const state = createState({ deps });
    expect(state.getState()).toEqual({ app: { uuid: "abc-123" } });
  });

  it("falls back to empty state when state.json is malformed", () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue("{not json");
    const state = createState({ deps });
    expect(state.getState()).toEqual({});
    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("updateState deep merges into the in-memory state", () => {
    const state = createState({ deps: makeDeps() });
    state.updateState({ app: { uuid: "abc-123" } });
    state.updateState({ app: { identifier: "my-app" } });
    expect(state.getState()).toEqual({
      app: { uuid: "abc-123", identifier: "my-app" },
    });
  });

  it("saveState writes the current state to .bbs/state.json", () => {
    const deps = makeDeps();
    const state = createState({ deps });
    state.updateState({ app: { uuid: "abc-123" } });
    state.saveState();
    const expectedPath = path.resolve(process.cwd(), ".bbs", "state.json");
    expect(deps.director.writeFile).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify({ app: { uuid: "abc-123" } }, null, 2),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/state.test.ts`
Expected: FAIL — `Cannot find module '../utils/state'` (module doesn't exist yet).

- [ ] **Step 3: Write the implementation**

Create `src/utils/state/index.ts`:

```ts
import path from "path";
import type { Config } from "../config/types";
import type { DeepPartial } from "../types";
import type { LoggerAPI } from "../logger";
import type { DirectorAPI } from "../director";

export type StateData = {
  app?: Partial<Config["app"]>;
  scaffolder?: {
    templates?: {
      versions?: NonNullable<Config["scaffolder"]["templates"]["versions"]>;
    };
  };
};

export type StateDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
};

export type StateAPI = {
  getState: () => StateData;
  updateState: (partial: DeepPartial<StateData>) => void;
  saveState: () => void;
};

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export function createState({ deps }: { deps: StateDeps }): StateAPI {
  const STATE_PATH = path.resolve(process.cwd(), ".bbs", "state.json");
  let _data: StateData = loadState();

  function loadState(): StateData {
    if (deps.director.exists(STATE_PATH)) {
      try {
        return JSON.parse(
          deps.director.readFile(STATE_PATH) ?? "{}",
        ) as StateData;
      } catch (err) {
        deps.logger.error(
          "Unable to parse .bbs/state.json! Falling back to empty state.",
        );
        deps.logger.debug(err);
      }
    }
    return {};
  }

  return {
    getState() {
      return _data;
    },
    updateState(partial) {
      deps.logger.debug("Storing new state value", partial);
      _data = deepMerge(_data, partial) as StateData;
    },
    saveState() {
      deps.logger.debug("Saving state to .bbs/state.json");
      deps.director.writeFile(STATE_PATH, JSON.stringify(_data, null, 2));
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/__tests__/state.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/state/index.ts src/__tests__/state.test.ts
git commit -m "feat(config): add .bbs/state.json state module"
```

---

### Task 2: Rewrite the config module (`bootstrapConfig` + public `createConfig`)

**Files:**

- Modify: `src/utils/config/index.ts` (full rewrite)
- Modify: `src/utils/config/types/index.ts` (add `BbsUserConfig`... actually kept in `config/index.ts`, see below)
- Modify: `src/utils/types.ts` (add `state: StateAPI` to `AppDeps`)
- Modify: `src/__tests__/config.test.ts` (full rewrite)

**Interfaces:**

- Consumes: `StateAPI`, `StateData` from `../state` (Task 1).
- Produces: `bootstrapConfig({ opts, deps }): ConfigAPI` (renamed from `createConfig` — this is the name collision the design doc calls out), `createConfig(config: BbsUserConfig): BbsUserConfig` (new public identity helper), `type BbsUserConfig`, `type ConfigDeps` (now includes `state: StateAPI`). `ConfigAPI` loses `saveConfig`, gains `loadUserConfig: () => Promise<void>`. Task 3 imports `bootstrapConfig` and `createConfig` from `./config`.

- [ ] **Step 1: Write the failing tests**

Replace `src/__tests__/config.test.ts` entirely:

```ts
import { mock, describe, it, expect, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { bootstrapConfig } from "../utils/config";
import type { LoggerAPI } from "../utils/logger";
import type { DirectorAPI } from "../utils/director";
import type { PrompterAPI } from "../utils/prompter";
import type { StateAPI } from "../utils/state";

const makeDeps = () => ({
  director: {
    exists: mock(() => false),
    readFile: mock(() => ""),
    getTsConfig: mock(() => null),
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
  it("defaults srcDir to 'functions'", () => {
    const config = bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    expect(config.srcDir).toBe("functions");
  });

  it("uses .js extension when no tsconfig found", () => {
    const config = bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    expect(config.projectExtension).toBe(".js");
  });

  it("uses .ts extension when tsconfig found", () => {
    const deps = makeDeps();
    (deps.director.getTsConfig as any).mockReturnValue({ compilerOptions: {} });
    const config = bootstrapConfig({ opts: { force: false }, deps });
    expect(config.projectExtension).toBe(".ts");
  });

  it("updateConfig mutates the internal state", () => {
    const config = bootstrapConfig({
      opts: { force: false },
      deps: makeDeps(),
    });
    config.updateConfig({ app: { uuid: "abc-123", identifier: "", zone: "" } });
    expect(config.app.uuid).toBe("abc-123");
  });

  it("force flag is exposed on the config object", () => {
    const config = bootstrapConfig({ opts: { force: true }, deps: makeDeps() });
    expect(config.force).toBe(true);
  });

  it("fills gaps from .bbs/state.json", () => {
    const deps = makeDeps();
    (deps.state.getState as any).mockReturnValue({
      app: { uuid: "state-uuid" },
    });
    const config = bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("state-uuid");
  });

  it("legacy config.json overrides .bbs/state.json", () => {
    const deps = makeDeps();
    (deps.state.getState as any).mockReturnValue({
      app: { uuid: "state-uuid" },
    });
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue(
      JSON.stringify({ app: { uuid: "legacy-uuid" } }),
    );
    const config = bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("legacy-uuid");
  });

  it("falls back to defaults when config.json is malformed", () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue("{not json");
    const config = bootstrapConfig({ opts: { force: false }, deps });
    expect(config.app.uuid).toBe("");
    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("getAppUUID persists the resolved uuid to state", async () => {
    const deps = makeDeps();
    (deps.prompter.input as any).mockResolvedValue("prompted-uuid");
    const config = bootstrapConfig({ opts: { force: false }, deps });
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
      const config = bootstrapConfig({ opts: { force: false }, deps });
      await expect(config.loadUserConfig()).resolves.toBeUndefined();
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
      const config = bootstrapConfig({ opts: { force: false }, deps });
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
      const config = bootstrapConfig({ opts: { force: false }, deps });

      await expect(config.loadUserConfig()).rejects.toThrow(
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
      const config = bootstrapConfig({ opts: { force: false }, deps });

      await expect(config.loadUserConfig()).rejects.toThrow(
        "Failed to load bbs.config.ts",
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/config.test.ts`
Expected: FAIL — `bootstrapConfig` is not exported (old file only exports `createConfig`), and `ConfigDeps`/mocks don't include `state`.

- [ ] **Step 3: Write the implementation**

Replace the full contents of `src/utils/config/index.ts`:

```ts
import path from "path";
import { Config } from "./types";
import { DeepPartial } from "../types";
import type { LoggerAPI } from "../logger";
import type { DirectorAPI } from "../director";
import type { PrompterAPI } from "../prompter";
import type { StateAPI } from "../state";

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

const DEFAULT_CONFIG: Config = {
  buildOptions: {
    js: undefined,
    ts: undefined,
  },
  scaffolder: {
    cacheDir: ".tmp",
    templates: {
      name: "codegen-templates",
      functions: {
        new: "functions/new",
        test: "functions/test",
        project: {
          ts: {
            name: "bb-generic-actions-typescript",
            path: "functions/projects/ts",
            url: "https://github.com/degrootsam/bb-generic-actions-typescript",
            description: "TypeScript project template",
          },
          js: {
            name: "bb-generic-actions",
            path: "functions/projects/js",
            url: "https://github.com/degrootsam/bb-generic-actions",
            description: "JavaScript project template",
          },
        },
        typegen: "functions/types/index.ts",
      },
      components: {
        new: "components/new",
        project: {
          name: "bb-generic-components",
          path: "templates/components/project",
          url: "https://github.com/degrootsam/component-templates",
        },
      },
      url: "https://github.com/degrootsam/codegen-templates",
      path: "codegen-templates",
    },
    tests: {
      directory: "__tests__",
    },
  },
  app: {
    uuid: "",
    identifier: "",
    zone: "",
  },
  options: {
    appDomain: "betty.app",
    https: true,
    env: "",
    schemaURL: "https://raw.githubusercontent.com",
    functionSchemaPath:
      "/bettyblocks/json-schema/master/schemas/actions/function.json",
    cacheDir: ".tmp/",
    fusionAuthURL: "https://id{ENVPOSTFIX}.bettyblocks.com",
    builderAPIURL: "api/builder",
    blockstoreAPIURL: "https://my{ENVPOSTFIX}.bettyblocks.com/block-store-api",
    domain: "bettyblocks.com",
    agentOptions: undefined,
    skipCompile: false,
  },
};

export type BbsUserConfig = {
  app?: Partial<Config["app"]>;
  options?: DeepPartial<Config["options"]>;
  buildOptions?: Config["buildOptions"];
};

export function createConfig(config: BbsUserConfig): BbsUserConfig {
  return config;
}

export type ConfigDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
  prompter: PrompterAPI;
  state: StateAPI;
};

export type ConfigAPI = {
  force: boolean;
  isTypescript: boolean;
  app: Config["app"];
  buildOptions:
    | NonNullable<Config["buildOptions"]>["ts"]
    | NonNullable<Config["buildOptions"]>["js"];
  srcDir: string;
  buildDir: string;
  projectExtension: string;
  scaffolder: Config["scaffolder"];
  options: Config["options"];
  httpProtocol: string;
  env: string;
  zone: string;
  schemaURL: string;
  functionSchemaPath: string;
  fusionAuthURL: string;
  blockstoreAPIURL: string;
  domain: string;
  skipCompile: boolean;
  getConfig: () => Config;
  updateConfig: (newConfig: DeepPartial<Config>) => void;
  loadUserConfig: () => Promise<void>;
  getAppUUID: () => Promise<string>;
  getAppIdentifier: () => Promise<string>;
  getApiURL: () => Promise<string>;
  builderAPIURL: () => Promise<string>;
};

export function bootstrapConfig({
  opts,
  deps,
}: {
  opts: { force?: boolean };
  deps: ConfigDeps;
}): ConfigAPI {
  const LEGACY_CONFIG_PATH = path.resolve(process.cwd(), "config.json");
  const USER_CONFIG_PATH = path.resolve(process.cwd(), "bbs.config.ts");
  const _isTs = deps.director.getTsConfig() !== null;
  const _force = opts.force ?? false;
  let _data: Config = loadConfig();

  function loadConfig(): Config {
    let merged = deepMerge(
      JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      deps.state.getState(),
    ) as Config;

    if (deps.director.exists(LEGACY_CONFIG_PATH)) {
      try {
        const legacyConfig = JSON.parse(
          deps.director.readFile(LEGACY_CONFIG_PATH) ?? "",
        );
        merged = deepMerge(merged, legacyConfig) as Config;
      } catch (err) {
        deps.logger.error(
          "Unable to parse config.json! Skipping legacy config file.",
        );
        deps.logger.debug(err);
      }
    }

    return merged;
  }

  async function importUserConfig(): Promise<BbsUserConfig | undefined> {
    if (!deps.director.exists(USER_CONFIG_PATH)) {
      return undefined;
    }

    let mod: any;
    try {
      mod = await import(USER_CONFIG_PATH);
    } catch (err) {
      throw new Error(
        `Failed to load bbs.config.ts: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!mod?.default || typeof mod.default !== "object") {
      throw new Error(
        "bbs.config.ts must have a default export from createConfig(...)",
      );
    }

    return mod.default as BbsUserConfig;
  }

  const api: ConfigAPI = {
    force: _force,
    isTypescript: _isTs,

    get app() {
      return _data.app;
    },
    get buildOptions() {
      return _isTs ? _data.buildOptions?.ts : _data.buildOptions?.js;
    },
    get srcDir() {
      const buildOption = _isTs
        ? _data.buildOptions?.ts
        : _data.buildOptions?.js;
      return buildOption?.srcDir || "functions";
    },
    get buildDir() {
      const buildOption = _isTs
        ? _data.buildOptions?.ts
        : _data.buildOptions?.js;
      return buildOption?.buildPath || ".tmp";
    },
    get projectExtension() {
      return _isTs ? ".ts" : ".js";
    },
    get scaffolder() {
      return _data.scaffolder;
    },
    get options() {
      return _data.options;
    },
    get httpProtocol() {
      return _data.options.https ? "https" : "http";
    },
    get env() {
      return _data.options.env;
    },
    get zone() {
      return _data.app.zone;
    },
    get schemaURL() {
      return _data.options.schemaURL;
    },
    get functionSchemaPath() {
      return _data.options.functionSchemaPath;
    },
    get fusionAuthURL() {
      return _data.options.fusionAuthURL.replace(
        "{ENVPOSTFIX}",
        _data.options.env,
      );
    },
    get blockstoreAPIURL() {
      return _data.options.blockstoreAPIURL.replace(
        "{ENVPOSTFIX}",
        _data.options.env,
      );
    },
    get domain() {
      return _data.options.domain;
    },
    get skipCompile() {
      return _data.options.skipCompile ?? false;
    },

    getConfig() {
      return _data;
    },

    updateConfig(newConfig = {}) {
      deps.logger.debug("Storing new config value", newConfig);
      _data = deepMerge(_data, newConfig) as Config;
    },

    async loadUserConfig() {
      const userConfig = await importUserConfig();
      if (userConfig) {
        api.updateConfig(userConfig as DeepPartial<Config>);
      }
    },

    async getAppUUID() {
      if (!_data.app.uuid) {
        const uuid = await deps.prompter.input("Please enter your app UUID");
        api.updateConfig({ app: { ..._data.app, uuid } });
        deps.state.updateState({ app: { uuid } });
      }
      return _data.app.uuid;
    },

    async getAppIdentifier() {
      if (!_data.app.identifier) {
        const identifier = await deps.prompter.input(
          "Please enter your app identifier",
        );
        api.updateConfig({ app: { ..._data.app, identifier } });
        deps.state.updateState({ app: { identifier } });
      }
      return _data.app.identifier;
    },

    async getApiURL() {
      const appIdentifier = await api.getAppIdentifier();
      const appUUID = await api.getAppUUID();
      return `${api.httpProtocol}://${appIdentifier}.${_data.options.appDomain}/api/runtime/${appUUID}`;
    },

    async builderAPIURL() {
      let subdomain = await api.getAppIdentifier();
      subdomain = `${subdomain}.${_data.options.domain}`;
      return `${api.httpProtocol}://${subdomain}/${_data.options.builderAPIURL}`;
    },
  };

  return api;
}
```

Then add `state` to `AppDeps` in `src/utils/types.ts`. Change:

```ts
import type { LoggerAPI } from "./logger";
import type { DirectorAPI } from "./director";
import type { PrompterAPI } from "./prompter";
import type { ConfigAPI } from "./config";
import type { createSpinner } from "nanospinner";
```

to:

```ts
import type { LoggerAPI } from "./logger";
import type { DirectorAPI } from "./director";
import type { PrompterAPI } from "./prompter";
import type { ConfigAPI } from "./config";
import type { StateAPI } from "./state";
import type { createSpinner } from "nanospinner";
```

and change:

```ts
export type AppDeps = {
  logger: LoggerAPI;
  director: DirectorAPI;
  prompter: PrompterAPI;
  config: ConfigAPI;
  spinner: SpinnerAPI;
};
```

to:

```ts
export type AppDeps = {
  logger: LoggerAPI;
  director: DirectorAPI;
  prompter: PrompterAPI;
  config: ConfigAPI;
  state: StateAPI;
  spinner: SpinnerAPI;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/__tests__/config.test.ts`
Expected: PASS (13 tests).

- [ ] **Step 5: Run the full test suite to check for regressions**

Run: `bun test src/__tests__`
Expected: PASS. (No other test file references the old `createConfig` export or `saveConfig`.)

- [ ] **Step 6: Commit**

```bash
git add src/utils/config/index.ts src/utils/types.ts src/__tests__/config.test.ts
git commit -m "feat(config): rename bootstrap fn to bootstrapConfig, add public createConfig, merge state+legacy config.json+bbs.config.ts"
```

---

### Task 3: Public library entry point for `createConfig`

**Files:**

- Create: `src/config.ts`
- Modify: `package.json`

**Interfaces:**

- Consumes: `createConfig`, `BbsUserConfig` from `./utils/config` (Task 2); `Config` from `./utils/config/types`.
- Produces: the package's public import surface — `import { createConfig } from "bbs-cli"` resolves to this file once built.

- [ ] **Step 1: Create the entry file**

Create `src/config.ts`:

```ts
export { createConfig } from "./utils/config";
export type { BbsUserConfig } from "./utils/config";
export type { Config } from "./utils/config/types";
```

- [ ] **Step 2: Point package.json's main/types at it**

In `package.json`, change:

```json
  "main": "dist/index.js",
```

to:

```json
  "main": "dist/config.js",
  "types": "dist/types/config.d.ts",
```

(Leave `"bin": { "bbs": "./dist/index.js" }` untouched — the CLI executable and the library import surface are two different entry points.)

- [ ] **Step 3: Verify it builds and resolves**

Run: `bun run build`
Expected: succeeds, produces `dist/config.js` and `dist/types/config.d.ts`.

Run: `node -e "console.log(typeof require('./dist/config.js').createConfig)"`
Expected: prints `function`.

- [ ] **Step 4: Commit**

```bash
git add src/config.ts package.json
git commit -m "feat(config): expose createConfig as the package's public entry point"
```

---

### Task 4: Wire state + config into CLI bootstrap, move to Bun runtime

**Files:**

- Modify: `src/utils/index.ts`
- Modify: `src/commands/index.ts`
- Modify: `src/index.ts`

**Interfaces:**

- Consumes: `createState` (Task 1), `bootstrapConfig` (Task 2).
- Produces: `deps.state: StateAPI` available to every command (used by Task 5); `config.loadUserConfig()` called once before any command action runs.

No dedicated automated test exists for these three files today (they are the CLI's top-level bootstrap/wiring, not pure functions — this matches the pre-existing lack of coverage for `src/utils/index.ts` and `src/commands/index.ts`). Verification is via the full test suite (regression check) plus a manual smoke run.

- [ ] **Step 1: Update `src/utils/index.ts`**

Change the import:

```ts
import { createConfig } from "./config";
```

to:

```ts
import { bootstrapConfig } from "./config";
import { createState } from "./state";
```

Change the bootstrap block:

```ts
const config = createConfig({
  opts: { force: !!(forceArg && forceArg.length > 0) },
  deps: { director, logger, prompter },
});

const deps: AppDeps = { logger, director, prompter, config, spinner };
```

to:

```ts
const state = createState({ deps: { director, logger } });
const config = bootstrapConfig({
  opts: { force: !!(forceArg && forceArg.length > 0) },
  deps: { director, logger, prompter, state },
});

const deps: AppDeps = { logger, director, prompter, config, state, spinner };
```

In `withErrorHandling`, change:

```ts
    try {
      await fn(...args);
      config.saveConfig();
    } catch (error) {
```

to:

```ts
    try {
      await fn(...args);
      state.saveState();
    } catch (error) {
```

Add `state` to the exports at the bottom of the file — change:

```ts
export {
  buildFunctions,
  bumpFunction,
  copyTemplateFromLocal,
  createCodeParser,
  clearToken,
  config,
  deepMerge,
  deps,
  director,
```

to:

```ts
export {
  buildFunctions,
  bumpFunction,
  copyTemplateFromLocal,
  createCodeParser,
  clearToken,
  config,
  deepMerge,
  deps,
  director,
  state,
```

(rest of the export list unchanged)

- [ ] **Step 2: Update `src/commands/index.ts`**

Change:

```ts
import { config, withErrorHandling, director } from "../utils";
```

to:

```ts
import { config, withErrorHandling, director, logger } from "../utils";
```

Change the top of `runCLI`:

```ts
const runCLI = async () => {
  const program = new Command();
```

to:

```ts
const runCLI = async () => {
  try {
    await config.loadUserConfig();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const program = new Command();
```

- [ ] **Step 3: Move the CLI shebang to Bun**

Change `src/index.ts` from:

```ts
#!/usr/bin/env -S node --no-warnings=ExperimentalWarning
import runCLI from "./commands";

runCLI();
```

to:

```ts
#!/usr/bin/env bun
import runCLI from "./commands";

runCLI();
```

- [ ] **Step 4: Run the full test suite**

Run: `bun test src/__tests__`
Expected: PASS — no test imports `../utils` or `../commands` directly, so this is a pure regression check.

- [ ] **Step 5: Build and smoke-test**

Run: `bun run build && chmod +x dist/index.js`

In an empty scratch directory, run: `bun dist/index.js functions init smoke-test-project`
Expected: project scaffolds without errors (no `bbs.config.ts` yet at this point in the plan — that lands in Task 5 — so this just confirms the bootstrap/loadUserConfig path doesn't break when the file is absent).

- [ ] **Step 6: Commit**

```bash
git add src/utils/index.ts src/commands/index.ts src/index.ts
git commit -m "feat(config): wire state+bbs.config.ts into CLI bootstrap, run CLI under Bun"
```

---

### Task 5: Update `src/utils/update/index.ts` to persist through state

**Files:**

- Modify: `src/utils/update/index.ts`

**Interfaces:**

- Consumes: `deps.state` (Task 4, via `AppDeps`).

No pre-existing test file covers `src/utils/update/index.ts` (confirmed: no `update.test.ts` in `src/__tests__`), so this task is a direct behavioral port with a full-suite regression check, matching the file's current lack of coverage.

- [ ] **Step 1: Mirror the codegen-templates version bump into state**

Change:

```ts
  if (newCodegenVersion) {
    if (codegenTemplateVersion !== newCodegenVersion) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
    }
  } else {
```

to:

```ts
  if (newCodegenVersion) {
    if (codegenTemplateVersion !== newCodegenVersion) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
    }
  } else {
```

- [ ] **Step 2: Mirror the TypeScript function-template version bump**

Change:

```ts
  if (newTsVersion) {
    if (newTsVersion !== functionVersions?.ts) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
    }
  } else {
```

to:

```ts
  if (newTsVersion) {
    if (newTsVersion !== functionVersions?.ts) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
    }
  } else {
```

- [ ] **Step 3: Mirror the JavaScript function-template version bump**

Change:

```ts
  if (newJsVersion) {
    if (newJsVersion !== functionVersions?.js) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
    }
  } else {
```

to:

```ts
  if (newJsVersion) {
    if (newJsVersion !== functionVersions?.js) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
    }
  } else {
```

- [ ] **Step 4: Replace the final persistence call**

Change the last line of `updateSubmodules`:

```ts
  deps.config.saveConfig();
}
```

to:

```ts
  deps.state.saveState();
}
```

- [ ] **Step 5: Run the full test suite**

Run: `bun test src/__tests__`
Expected: PASS (regression check — no test imports this file).

- [ ] **Step 6: Commit**

```bash
git add src/utils/update/index.ts
git commit -m "feat(config): persist template version bumps to .bbs/state.json instead of config.json"
```

---

### Task 6: Scaffold a starter `bbs.config.ts` on init

**Files:**

- Modify: `src/utils/scaffolder/index.ts`
- Modify: `src/commands/functions/init/index.ts`
- Modify: `src/commands/components/init/index.ts`
- Test: `src/__tests__/scaffolder.test.ts`

**Interfaces:**

- Consumes: `AppDeps` (Task 4).
- Produces: `generateBbsConfigFile({ deps, targetDir }: { deps: AppDeps; targetDir: string }): void`, used by both init commands.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/scaffolder.test.ts`:

```ts
import { mock, describe, it, expect } from "bun:test";
import path from "path";
import { generateBbsConfigFile } from "../utils/scaffolder";
import type { AppDeps } from "../utils/types";

const makeDeps = () =>
  ({
    director: {
      writeFile: mock(),
    },
  }) as Partial<AppDeps> as AppDeps;

describe("generateBbsConfigFile", () => {
  it("writes a starter bbs.config.ts into the target directory", () => {
    const deps = makeDeps();
    generateBbsConfigFile({ deps, targetDir: "my-project" });

    expect(deps.director.writeFile).toHaveBeenCalledTimes(1);
    const [outputPath, content] = (deps.director.writeFile as any).mock
      .calls[0];
    expect(outputPath).toBe(path.resolve("my-project", "bbs.config.ts"));
    expect(content).toContain('import { createConfig } from "bbs-cli";');
    expect(content).toContain("export default createConfig({");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test src/__tests__/scaffolder.test.ts`
Expected: FAIL — `generateBbsConfigFile` is not exported from `../utils/scaffolder`.

- [ ] **Step 3: Implement `generateBbsConfigFile`**

In `src/utils/scaffolder/index.ts`, add (after the existing imports, anywhere among the other exported functions):

```ts
export function generateBbsConfigFile({
  deps,
  targetDir,
}: {
  deps: AppDeps;
  targetDir: string;
}): void {
  const content = `import { createConfig } from "bbs-cli";

export default createConfig({
  app: {
    uuid: "",
    identifier: "",
    zone: "",
  },
});
`;
  const outputPath = path.resolve(targetDir, "bbs.config.ts");
  deps.director.writeFile(outputPath, content);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test src/__tests__/scaffolder.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire it into `bbs functions init`**

In `src/commands/functions/init/index.ts`, change:

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/functions";
```

to:

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/functions";
import { generateBbsConfigFile } from "../../../utils/scaffolder";
```

and change:

```ts
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, javascript: options.javascript });
      deps.director.changeDir(name);
```

to:

```ts
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, javascript: options.javascript });
      generateBbsConfigFile({ deps, targetDir: name });
      deps.director.changeDir(name);
```

- [ ] **Step 6: Wire it into `bbs components init`**

In `src/commands/components/init/index.ts`, change:

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/components";
```

to:

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/components";
import { generateBbsConfigFile } from "../../../utils/scaffolder";
```

and change:

```ts
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, force: options.force ?? false });
    }),
```

to:

```ts
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, force: options.force ?? false });
      generateBbsConfigFile({ deps, targetDir: name });
    }),
```

- [ ] **Step 7: Run the full test suite**

Run: `bun test src/__tests__`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/utils/scaffolder/index.ts src/commands/functions/init/index.ts src/commands/components/init/index.ts src/__tests__/scaffolder.test.ts
git commit -m "feat(config): scaffold a starter bbs.config.ts on functions/components init"
```

---

### Task 7: Update documentation

**Files:**

- Modify: `readme.md`

**Interfaces:** None (docs only).

- [ ] **Step 1: Replace the Configuration section**

In `readme.md`, replace:

````markdown
## Configuration

A `config.json` file at the project root is required. Minimal structure:

```json
{
  "app": {
    "uuid": "<app-uuid>",
    "identifier": "<app-identifier>",
    "zone": "<zone>"
  }
}
```
````

Optional overrides (all have defaults):

```json
{
  "scaffolder": {
    "templates": {
      "versions": {
        "templates": "^0.0.1",
        "functions": { "ts": "^1.0.0", "js": "^1.0.0" }
      }
    }
  }
}
```

````

with:

```markdown
## Configuration

Create a `bbs.config.ts` at the project root that exports a config via `createConfig`:

```ts
import { createConfig } from "bbs-cli";

export default createConfig({
  app: {
    uuid: "<app-uuid>",
    identifier: "<app-identifier>",
    zone: "<zone>",
  },
  options: {
    env: "production",
  },
});
````

`bbs functions init` and `bbs components init` scaffold a starter `bbs.config.ts` for you.

`bbs.config.ts` is optional and always wins over any other config source. If your project
has a legacy `config.json` (from an earlier version of this CLI), its values are still read
as a fallback — but it is never written to again. The CLI's own bookkeeping (resolved app
identity, template version pins) lives in `.bbs/state.json`, which the CLI manages fully —
you shouldn't need to edit it.

````

- [ ] **Step 2: Commit**

```bash
git add readme.md
git commit -m "docs: document bbs.config.ts in place of config.json"
````

---

## Self-Review Notes

- **Spec coverage:** public `createConfig` (Task 2/3), merge precedence (Task 2), `.bbs/state.json` (Task 1), removed `saveConfig`/write path (Task 2), `withErrorHandling`/`updateSubmodules` persistence swap (Task 4/5), `getAppUUID`/`getAppIdentifier` → state (Task 2), Bun runtime (Task 4), scaffolding (Task 6), docs (Task 7) — all covered.
- **Placeholder scan:** no TBDs; every step has literal code.
- **Type consistency:** `bootstrapConfig`, `createConfig`, `BbsUserConfig`, `ConfigDeps`, `StateAPI`, `StateData`, `generateBbsConfigFile` are spelled identically everywhere they're introduced and consumed across tasks.
