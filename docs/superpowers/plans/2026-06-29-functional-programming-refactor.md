# Functional Programming Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 13 classes with factory functions and plain function modules using an explicit AppDeps dependency injection context object, making every utility independently testable without class instantiation or singleton patching.

**Architecture:** Each utility module exports a `create*` factory function (closes over its deps) or plain exported functions (for stateless utilities). A shared `AppDeps` type holds all injectable deps. The barrel (`src/utils/index.ts`) assembles one real `deps` object; tests construct minimal mock objects. Three methods currently on `Director` (`checkSubmodulesForUpdate`, `updateSubmodules`) are extracted to a new `src/utils/update/index.ts` since they depend on `AppDeps` (which includes Director itself) — this breaks the circular dependency.

**Tech Stack:** TypeScript, Node.js, Jest (ts-jest, ESM preset), nanospinner, chalk, commander

## Global Constraints

- TypeScript: all new exported types must be explicit — no implicit `any` on signatures
- ESM throughout — no `require()`
- No files move: every `src/utils/*/index.ts` keeps its path (one new file created: `src/utils/update/index.ts`)
- `FusionAuth` and `RequestHandler` are out of scope — do not refactor them; instantiate inline where needed
- No changes to external CLI interface or `config.json` format
- Test runner: `npx jest --no-coverage` (single file: `npx jest --testPathPattern=<path> --no-coverage`)
- TDD: write failing test before implementation in every task
- After each task: run `npx jest --no-coverage` to confirm nothing regressed

---

## Task 1: createLogger

**Files:**

- Modify: `src/utils/logger/index.ts`
- Modify: `src/utils/index.ts`
- Modify: `__tests__/logger.test.ts`

**Interfaces:**

- Consumes: nothing (no barrel imports)
- Produces: `LoggerAPI` type, `createLogger(opts) => LoggerAPI`, `DEBUG_PREFIX`, `ERROR_PREFIX`

**Notes:**

- Remove `logger.success`, `logger.validatedFunctions`, `logger.uploadedFunction` from `LoggerAPI` — they have cross-module deps (spinner, FunctionsUtils). Call sites are migrated in their respective tasks (Tasks 8, 9, 11).
- No imports from `..` (barrel) — breaks existing circular dep.

- [ ] **Step 1: Write the failing test**

Add to `__tests__/logger.test.ts` (keep existing tests, add a new describe block below them):

```ts
import { createLogger, DEBUG_PREFIX, ERROR_PREFIX } from "../src/utils/logger";

describe("createLogger", () => {
  let debugSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("does not debug log when verbose=false", () => {
    const logger = createLogger({ verbose: false });
    logger.debug("hello");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("debug logs when verbose=true", () => {
    const logger = createLogger({ verbose: true });
    logger.debug("hello");
    expect(debugSpy).toHaveBeenCalledWith(DEBUG_PREFIX, "hello");
  });

  it("toggleVerbose enables debug logging", () => {
    const logger = createLogger({ verbose: false });
    logger.toggleVerbose(true);
    logger.debug("hello");
    expect(debugSpy).toHaveBeenCalledWith(DEBUG_PREFIX, "hello");
  });

  it("error logs with ERROR_PREFIX", () => {
    const logger = createLogger();
    logger.error("oops");
    expect(errorSpy).toHaveBeenCalledWith(ERROR_PREFIX, "oops");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=logger --no-coverage
```

Expected: FAIL — `createLogger is not a function` (or similar)

- [ ] **Step 3: Replace `src/utils/logger/index.ts` with the factory**

```ts
import chalk from "chalk";
import { Functions, FunctionResult } from "../functions/types";

export const DEBUG_PREFIX = chalk.bgWhite(chalk.black("DEBUG:"));
export const ERROR_PREFIX = chalk.bgRed(chalk.black("ERROR:"));

export type LoggerAPI = {
  debug: (...message: any[]) => void;
  error: (...message: any[]) => void;
  info: (...message: any[]) => void;
  warn: (...message: any[]) => void;
  toggleVerbose: (verbose: boolean) => void;
  getValidationPrefix: (state: boolean) => string;
  getValidationColor: (state: boolean) => chalk.ChalkInstance;
};

export function createLogger({
  verbose = false,
}: { verbose?: boolean } = {}): LoggerAPI {
  let _verbose = verbose;

  const errorColor = chalk.redBright;
  const successColor = chalk.greenBright;
  const warningColor = chalk.yellowBright;

  return {
    toggleVerbose(v) {
      _verbose = v;
    },
    debug(...message) {
      if (_verbose) console.debug(DEBUG_PREFIX, ...message);
    },
    error(...message) {
      console.error(ERROR_PREFIX, ...message);
    },
    info(...message) {
      console.info(...message);
    },
    warn(...message) {
      console.log(warningColor("⚠", message));
    },
    getValidationPrefix(state) {
      return state ? "√" : "x";
    },
    getValidationColor(state) {
      return state ? successColor : errorColor;
    },
  };
}
```

- [ ] **Step 4: Update `src/utils/index.ts` — replace `new Logger` with `createLogger`**

Replace:

```ts
import Logger from "./logger/index";
// ...
const logger = new Logger({ verbose: verboseArg && verboseArg.length > 0 });
```

With:

```ts
import { createLogger } from "./logger/index";
// ...
const logger = createLogger({
  verbose: !!(verboseArg && verboseArg.length > 0),
});
```

Also remove `Logger` from the exports list at the bottom (it's no longer a class to export).

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass (existing logger singleton tests still work — same interface)

- [ ] **Step 6: Commit**

```bash
git add src/utils/logger/index.ts src/utils/index.ts __tests__/logger.test.ts
git commit -m "refactor(logger): class → createLogger factory"
```

---

## Task 2: createDirector

**Files:**

- Modify: `src/utils/director/index.ts`
- Modify: `src/utils/index.ts`
- Create: `__tests__/director.test.ts`

**Interfaces:**

- Consumes: `LoggerAPI` from `../logger`
- Produces: `DirectorAPI` type, `createDirector(logger: LoggerAPI) => DirectorAPI`
- Note: `checkSubmodulesForUpdate` and `updateSubmodules` are removed from `DirectorAPI` — they move to `src/utils/update/index.ts` in Task 9. The update command will be fixed in Task 9.
- Note: `resolveCLITemplatePath` signature changes from `(): string` to `(templatesPath: string): string` — callers pass `deps.config.scaffolder.templates.path`.

- [ ] **Step 1: Write the failing test**

Create `__tests__/director.test.ts`:

```ts
import { jest } from "@jest/globals";
import { createDirector } from "../src/utils/director";
import { createLogger } from "../src/utils/logger";

describe("createDirector", () => {
  const logger = createLogger({ verbose: false });
  const director = createDirector(logger);

  it("returns an object with core filesystem methods", () => {
    expect(typeof director.readFile).toBe("function");
    expect(typeof director.writeFile).toBe("function");
    expect(typeof director.exists).toBe("function");
    expect(typeof director.runCommand).toBe("function");
  });

  it("exists returns false for a non-existent path", () => {
    expect(director.exists("/nonexistent/path/xyz123")).toBe(false);
  });

  it("exists returns true for __dirname", () => {
    expect(director.exists(__dirname)).toBe(true);
  });

  it("resolveCLIPath returns a non-empty string", () => {
    const result = director.resolveCLIPath();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("resolveCLITemplatePath resolves relative to CLI path", () => {
    const result = director.resolveCLITemplatePath("codegen-templates");
    expect(result).toContain("codegen-templates");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest --testPathPattern=director --no-coverage
```

Expected: FAIL — `createDirector is not a function`

- [ ] **Step 3: Replace `src/utils/director/index.ts` with the factory**

```ts
import fs from "fs-extra";
import path from "path";
import { spawn, SpawnOptions } from "child_process";
import archiver from "archiver";
import os from "os";
import { isErrorWithMessage } from "..";
import type { LoggerAPI } from "../logger";

export type DirectorAPI = {
  resolveCLIPath: () => string;
  resolveCLITemplatePath: (templatesPath: string) => string;
  createDir: (name: string) => void;
  readDir: (path: string, recursive?: boolean) => string[];
  copyDir: (sourceDir: string, targetDir: string) => Promise<void>;
  exists: (targetPath: string) => boolean;
  changeDir: (path: string) => void;
  zipDir: (sourceDir: string, outputPath: string) => Promise<void>;
  removeDir: (dirPath: string) => void;
  writeFile: (
    outputPath: string,
    content: string,
    encoding?: BufferEncoding,
  ) => void;
  readFile: (path: string, silent?: boolean) => string;
  getPackageJSON: () => null | Record<string, any>;
  getTsConfig: () => null | Record<string, any>;
  findBbsCliPath: () => Promise<string | null>;
  runCommand: (
    command: string,
    args?: string[],
    options?: SpawnOptions,
  ) => Promise<string>;
};

export function createDirector(logger: LoggerAPI): DirectorAPI {
  return {
    resolveCLIPath() {
      return __dirname.split("/dist/")[0];
    },

    resolveCLITemplatePath(templatesPath) {
      return path.resolve(this.resolveCLIPath(), templatesPath);
    },

    createDir(name) {
      logger.debug(`Creating directory in ${name}`);
      fs.mkdirSync(name, { recursive: true });
    },

    readDir(dirPath, recursive = false) {
      logger.debug(`Reading directory at ${dirPath}`);
      const directory = fs.readdirSync(dirPath, {
        recursive,
        encoding: "utf8",
      });
      logger.debug(directory);
      return directory;
    },

    async copyDir(sourceDir, targetDir) {
      return fs.cpSync(sourceDir, targetDir, { recursive: true });
    },

    exists(targetPath) {
      logger.debug(`Checking if ${targetPath} exists`);
      const result = fs.existsSync(targetPath);
      logger.debug(`Result: ${result}`);
      return result;
    },

    changeDir(dirPath) {
      if (!dirPath) {
        throw new Error(
          `Unable to move to project dir! Directory ${dirPath} does not exist.`,
        );
      }
      logger.debug(`Closing shell and moving to directory at: ${dirPath}`);
      process.chdir(dirPath);
      logger.debug(
        `Successfully changed current working directory to ${dirPath}`,
      );
    },

    async zipDir(sourceDir, outputPath) {
      logger.debug(
        `Compressing directory ${sourceDir}. Creating archive at ${outputPath}`,
      );
      if (!fs.existsSync(sourceDir)) {
        throw new Error(
          `Unable to compress directory! Path does not exist: ${sourceDir}`,
        );
      }
      const output = fs.createWriteStream(outputPath);
      const archive = archiver("zip", { zlib: { level: 9 } });
      return new Promise((resolve, reject) => {
        output.on("close", () => {
          logger.debug(`ZIP created successfully: ${archive.pointer()} bytes`);
          resolve(true as any);
        });
        archive.on("error", reject);
        output.on("error", reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize().catch(reject);
      });
    },

    removeDir(dirPath) {
      logger.debug(`Removing directory at ${dirPath}`);
      fs.rmdirSync(dirPath, { recursive: true });
    },

    writeFile(outputPath, content, encoding = "utf-8") {
      logger.debug(`Writing file to ${outputPath}`);
      const contentSize = Buffer.byteLength(content, "utf-8");
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      logger.debug(`Size in bytes ${contentSize}`);
      logger.debug(`Encoding: ${encoding}`);
      fs.writeFileSync(outputPath, content, { encoding, mode: 0o666 });
      logger.debug("File written successfully");
    },

    readFile(filePath, silent = false) {
      logger.debug(`Opening file at ${filePath}`);
      try {
        return fs.readFileSync(filePath, { encoding: "utf-8" });
      } catch (error) {
        if (silent) return "";
        if (isErrorWithMessage(error) && error.message.includes("ENOENT")) {
          logger.error(error.message);
          return "";
        }
        throw error;
      }
    },

    getPackageJSON() {
      try {
        const fileContent = this.readFile("package.json");
        if (!fileContent) return null;
        return JSON.parse(fileContent);
      } catch (error) {
        logger.error("Unable to parse package.json");
        throw new Error(error as any);
      }
    },

    getTsConfig() {
      try {
        let fileContent = this.readFile("tsconfig.json", true);
        if (!fileContent) return null;
        const commentRegex =
          /((\/\*\*)(\/\*)[\S\s]*?(\*\/))|((\/\/)[\S\s]*?(?=[\n\r]))/g;
        fileContent = fileContent.replaceAll(commentRegex, "");
        return JSON.parse(fileContent);
      } catch (error) {
        logger.error("Unable to parse tsconfig.json");
        throw new Error(error as any);
      }
    },

    async findBbsCliPath() {
      const command = os.platform() === "win32" ? "where" : "which";
      try {
        return await this.runCommand(command, ["bbs"]);
      } catch {
        return null;
      }
    },

    async runCommand(command, args = [], options = {}) {
      return new Promise((resolve, reject) => {
        let output = "";
        let errorOutput = "";
        logger.debug({ command, args, options });
        try {
          const child = spawn(command, args, { ...options, stdio: "pipe" });
          child.stdout?.on("data", (data) => {
            output += data.toString();
          });
          child.stderr?.on("data", (data) => {
            errorOutput += data.toString();
          });
          child.on("close", (code) => {
            if (code !== 0) {
              reject(
                new Error(
                  `Command failed with exit code ${code}: ${command} ${args.join(" ")}\n${errorOutput}`,
                ),
              );
            } else {
              resolve(output.trim());
            }
          });
          child.on("error", (err) => {
            reject(
              new Error(
                `Failed to run command: ${command} ${args.join(" ")}\n${err.message}`,
              ),
            );
          });
        } catch (err) {
          reject(
            new Error(
              `Unexpected error while running command: ${command} ${args.join(" ")}\n${(err as Error).message}`,
            ),
          );
        }
      });
    },
  };
}
```

- [ ] **Step 4: Update `src/utils/index.ts` — replace `new Director()` with `createDirector`**

Replace:

```ts
import Director from "./director";
// ...
const director = new Director();
```

With:

```ts
import { createDirector } from "./director";
// ...
const director = createDirector(logger);
```

Remove `Director` default import from the barrel and from the exports list.

- [ ] **Step 5: Fix `resolveCLITemplatePath` call sites**

`director.resolveCLITemplatePath()` previously took no args; now takes `templatesPath: string`. Find all call sites:

```bash
grep -rn "resolveCLITemplatePath" src/ --include="*.ts"
```

For each call site, update:

```ts
// before
director.resolveCLITemplatePath();
// after
director.resolveCLITemplatePath(deps.config.scaffolder.templates.path);
// or, in files that still have config in scope:
director.resolveCLITemplatePath(config.scaffolder.templates.path);
```

- [ ] **Step 6: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/utils/director/index.ts src/utils/index.ts __tests__/director.test.ts
git commit -m "refactor(director): class → createDirector factory"
```

---

## Task 3: createPrompter

**Files:**

- Modify: `src/utils/prompter/index.ts`
- Modify: `src/utils/index.ts`
- (No test changes needed — existing prompter test uses the singleton which keeps its interface)

**Interfaces:**

- Consumes: `LoggerAPI`
- Produces: `PrompterAPI` type, `createPrompter(logger: LoggerAPI) => PrompterAPI`

- [ ] **Step 1: Write the failing test**

Add to `__tests__/prompter.test.ts` at the top (before the existing describe block):

```ts
import { createPrompter } from "../src/utils/prompter";
import { createLogger } from "../src/utils/logger";

describe("createPrompter", () => {
  it("returns an object with prompt methods", () => {
    const logger = createLogger({ verbose: false });
    const prompter = createPrompter(logger);
    expect(typeof prompter.input).toBe("function");
    expect(typeof prompter.confirm).toBe("function");
    expect(typeof prompter.select).toBe("function");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest --testPathPattern=prompter --no-coverage
```

Expected: FAIL — `createPrompter is not a function`

- [ ] **Step 3: Replace `src/utils/prompter/index.ts` with the factory**

```ts
import { confirm, editor, input, password, select } from "@inquirer/prompts";
import type { LoggerAPI } from "../logger";

export type SelectChoice = {
  description?: string;
  value: string;
  name: string;
  short?: string;
  separator?: string;
  disabled?: string;
};

export type PrompterAPI = {
  input: (
    message: string,
    required?: boolean,
    validate?: (value: string) => boolean | string,
  ) => Promise<string>;
  editor: (
    message: string,
    validate?: (value: string) => boolean | string,
  ) => Promise<string>;
  getUsername: () => Promise<string>;
  getPassword: () => Promise<string>;
  getAuthProfileUUID: () => Promise<string>;
  getURL: (message: string) => Promise<string>;
  select: (
    choices: SelectChoice[],
    message?: string,
    def?: string,
  ) => Promise<string>;
  confirm: (message: string, def?: boolean) => Promise<boolean>;
};

export function createPrompter(logger: LoggerAPI): PrompterAPI {
  return {
    async input(message, required, validate) {
      const answer = await input({ message, required, validate });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async editor(message, validate) {
      const answer = await editor({ message, validate });
      logger.debug("Answer", answer);
      return answer;
    },

    async getUsername() {
      const answer = await input({
        message: "Please provide your username",
        required: true,
      });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async getPassword() {
      return await password({
        mask: "*",
        message: "Please provide your password",
        validate(value) {
          if (!value) return "Password is required";
          return true;
        },
      });
    },

    async getAuthProfileUUID() {
      const answer = await input({
        message: "Please enter the UUID of the authentication profile",
        required: true,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async getURL(message) {
      const answer = await input({
        message,
        required: true,
        validate(value) {
          const urlMatch = value.match(
            /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/g,
          );
          if (urlMatch && urlMatch.length > 0) return true;
          return "Please provide a valid URL";
        },
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async select(choices, message, def) {
      const answer = await select({
        message: message ?? "Please make a choice",
        choices,
        loop: true,
        default: def,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async confirm(message, def = true) {
      const answer = await confirm({ message, default: def });
      logger.debug(`Answer ${answer}`);
      return answer;
    },
  };
}
```

- [ ] **Step 4: Update `src/utils/index.ts` — replace `new Prompter()` with `createPrompter`**

Replace:

```ts
import Prompter from "./prompter";
// ...
const prompter = new Prompter();
```

With:

```ts
import { createPrompter } from "./prompter";
// ...
const prompter = createPrompter(logger);
```

Remove `Prompter` from exports list.

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/prompter/index.ts src/utils/index.ts __tests__/prompter.test.ts
git commit -m "refactor(prompter): class → createPrompter factory"
```

---

## Task 4: createConfig

**Files:**

- Modify: `src/utils/config/index.ts`
- Modify: `src/utils/index.ts`
- Create: `__tests__/config.test.ts`

**Interfaces:**

- Consumes: `DirectorAPI`, `LoggerAPI`, `PrompterAPI`
- Produces: `ConfigAPI` type, `createConfig(opts, deps) => ConfigAPI`

- [ ] **Step 1: Write the failing test**

Create `__tests__/config.test.ts`:

```ts
import { jest } from "@jest/globals";
import { createConfig } from "../src/utils/config";
import type { LoggerAPI } from "../src/utils/logger";
import type { DirectorAPI } from "../src/utils/director";
import type { PrompterAPI } from "../src/utils/prompter";

const mockLogger: LoggerAPI = {
  debug: jest.fn() as any,
  error: jest.fn() as any,
  info: jest.fn() as any,
  warn: jest.fn() as any,
  toggleVerbose: jest.fn() as any,
  getValidationPrefix: jest.fn(() => "√") as any,
  getValidationColor: jest.fn() as any,
};

const mockDirector: Partial<DirectorAPI> = {
  exists: jest.fn(() => false) as any, // no config.json on disk
  readFile: jest.fn(() => "") as any,
  getTsConfig: jest.fn(() => null) as any, // JS project
};

const mockPrompter: Partial<PrompterAPI> = {
  input: jest.fn() as any,
};

const makeDeps = () => ({
  director: mockDirector as DirectorAPI,
  logger: mockLogger,
  prompter: mockPrompter as PrompterAPI,
});

describe("createConfig", () => {
  beforeEach(() => jest.clearAllMocks());

  it("defaults srcDir to 'functions'", () => {
    const config = createConfig({ force: false }, makeDeps());
    expect(config.srcDir).toBe("functions");
  });

  it("uses .js extension when no tsconfig found", () => {
    const config = createConfig({ force: false }, makeDeps());
    expect(config.projectExtension).toBe(".js");
  });

  it("uses .ts extension when tsconfig found", () => {
    const deps = makeDeps();
    (deps.director.getTsConfig as any).mockReturnValue({ compilerOptions: {} });
    const config = createConfig({ force: false }, deps);
    expect(config.projectExtension).toBe(".ts");
  });

  it("updateConfig mutates the internal state", () => {
    const config = createConfig({ force: false }, makeDeps());
    config.updateConfig({ app: { uuid: "abc-123", identifier: "", zone: "" } });
    expect(config.app.uuid).toBe("abc-123");
  });

  it("force flag is exposed on the config object", () => {
    const config = createConfig({ force: true }, makeDeps());
    expect(config.force).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest --testPathPattern=config --no-coverage
```

Expected: FAIL — `createConfig is not a function`

- [ ] **Step 3: Replace `src/utils/config/index.ts` with the factory**

```ts
import path from "path";
import { Config } from "./types";
import { deepMerge } from "..";
import { DeepPartial } from "../types";
import type { LoggerAPI } from "../logger";
import type { DirectorAPI } from "../director";
import type { PrompterAPI } from "../prompter";

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

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

export type ConfigDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
  prompter: PrompterAPI;
};

export type ConfigAPI = {
  force: boolean;
  isTypescript: boolean;
  app: Config["app"];
  buildOptions: Config["buildOptions"]["ts"] | Config["buildOptions"]["js"];
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
  saveConfig: (
    newConfig?: DeepPartial<Config>,
    full?: boolean,
    force?: boolean,
  ) => void;
  getAppUUID: () => Promise<string>;
  getAppIdentifier: () => Promise<string>;
  getApiURL: () => Promise<string>;
  builderAPIURL: () => Promise<string>;
};

export function createConfig(
  opts: { force?: boolean },
  deps: ConfigDeps,
): ConfigAPI {
  let _data: Config = loadConfig(deps);
  let _updated = false;
  const _isTs = deps.director.getTsConfig() !== null;
  const _force = opts.force ?? false;

  function loadConfig({ director, logger }: ConfigDeps): Config {
    if (director.exists(CONFIG_PATH)) {
      try {
        const userConfig = JSON.parse(director.readFile(CONFIG_PATH) ?? "");
        return deepMerge(DEFAULT_CONFIG, { ...userConfig }) as Config;
      } catch (err) {
        logger.error(
          "Unable to parse config.json! Falling back to default config.",
        );
        logger.debug(err);
      }
    }
    return { ...DEFAULT_CONFIG };
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
      return _data.options.skipCompile;
    },

    getConfig() {
      return _data;
    },

    updateConfig(newConfig = {}) {
      deps.logger.debug("Storing new config value", newConfig);
      _data = deepMerge(_data, newConfig) as Config;
      _updated = true;
    },

    saveConfig(newConfig = {}, full = false, force = false) {
      deps.logger.debug("Saving new config to config.json");
      deps.logger.debug({ newConfig });
      if (_updated || newConfig || force) {
        api.updateConfig(newConfig);
        const content = full
          ? _data
          : ({
              app: _data.app,
              scaffolder: {
                templates: {
                  versions: { ..._data.scaffolder.templates.versions },
                },
              },
            } as DeepPartial<Config>);
        deps.director.writeFile(CONFIG_PATH, JSON.stringify(content, null, 2));
      }
    },

    async getAppUUID() {
      if (!_data.app.uuid) {
        const uuid = await deps.prompter.input("Please enter your app UUID");
        api.updateConfig({ app: { ..._data.app, uuid } });
      }
      return _data.app.uuid;
    },

    async getAppIdentifier() {
      if (!_data.app.identifier) {
        const identifier = await deps.prompter.input(
          "Please enter your app identifier",
        );
        api.updateConfig({ app: { ..._data.app, identifier } });
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

- [ ] **Step 4: Update `src/utils/index.ts` — replace `new ConfigManager` with `createConfig`**

Replace:

```ts
import { ConfigManager } from "./config";
// ...
const config = new ConfigManager({ force: forceArg && forceArg.length > 0 });
```

With:

```ts
import { createConfig } from "./config";
// ...
const config = createConfig(
  { force: !!(forceArg && forceArg.length > 0) },
  { director, logger, prompter },
);
```

Remove `ConfigManager` from the exports list. Keep `config` export as-is.

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/config/index.ts src/utils/index.ts __tests__/config.test.ts
git commit -m "refactor(config): ConfigManager class → createConfig factory"
```

---

## Task 5: Define AppDeps + export deps from barrel

**Files:**

- Modify: `src/utils/types.ts`
- Modify: `src/utils/index.ts`

**Interfaces:**

- Consumes: `LoggerAPI`, `DirectorAPI`, `PrompterAPI`, `ConfigAPI` (all defined in prior tasks)
- Produces: `AppDeps` type exported from `src/utils/types.ts`, `deps` object exported from `src/utils/index.ts`

No new tests — this is wiring/typing only.

- [ ] **Step 1: Add `AppDeps` to `src/utils/types.ts`**

Add at the bottom of the file:

```ts
import type { LoggerAPI } from "./logger";
import type { DirectorAPI } from "./director";
import type { PrompterAPI } from "./prompter";
import type { ConfigAPI } from "./config";
import type { createSpinner } from "nanospinner";

export type AppDeps = {
  logger: LoggerAPI;
  director: DirectorAPI;
  prompter: PrompterAPI;
  config: ConfigAPI;
  spinner: ReturnType<typeof createSpinner>;
};
```

- [ ] **Step 2: Export `deps` from `src/utils/index.ts`**

After the existing singleton declarations (`logger`, `director`, `prompter`, `config`, `spinner`), add:

```ts
import type { AppDeps } from "./types";

export const deps: AppDeps = { logger, director, prompter, config, spinner };
```

- [ ] **Step 3: Update `withErrorHandling` to use `deps` references**

The existing `withErrorHandling` references `config` and `logger` from the closure — this is fine as-is since they're the same objects in `deps`. No change needed here.

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/types.ts src/utils/index.ts
git commit -m "feat: add AppDeps type and export deps from barrel"
```

---

## Task 6: createCodeParser

**Files:**

- Modify: `src/utils/code-parser/index.ts`
- Modify: `__tests__/code-parser.test.ts`

**Interfaces:**

- Consumes: `LoggerAPI`
- Produces: `CodeParserAPI` type, `createCodeParser(type: 'js'|'ts', logger: LoggerAPI) => CodeParserAPI`

- [ ] **Step 1: Update `__tests__/code-parser.test.ts` to use factory**

Replace the entire file:

```ts
import { jest } from "@jest/globals";
import { createCodeParser } from "../src/utils/code-parser";
import { createLogger } from "../src/utils/logger";
import { FunctionInfo } from "../src/utils/functions/types";

const logger = createLogger({ verbose: false });

describe("createCodeParser", () => {
  describe("parses javascript", () => {
    const functionInfo: FunctionInfo = {
      fileType: "js",
      latestVersion: "1.0",
      path: "",
      validation: {
        info: { isAsync: false, isDefaultExport: false, matchesName: false },
        valid: false,
      },
      versions: new Set(["1.0"]),
    };

    it("validates as async", () => {
      const codeParser = createCodeParser("js", logger);
      const code = `export default async function helloWorld(){ return null; }`;

      const expected: FunctionInfo = {
        ...functionInfo,
        validation: {
          info: { isAsync: true, isDefaultExport: false, matchesName: false },
          valid: false,
        },
      };

      expect(
        codeParser.validateFunction(code, functionInfo, "helloWorld"),
      ).toStrictEqual(expected);
    });

    it("validates as default export", () => {
      const codeParser = createCodeParser("js", logger);
      const code = `async function helloWorld(){ return null; } export default helloWorld;`;

      const result = codeParser.validateFunction(
        code,
        functionInfo,
        "helloWorld",
      );
      expect(result.validation.info.isDefaultExport).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest --testPathPattern=code-parser --no-coverage
```

Expected: FAIL — `createCodeParser is not a function`

- [ ] **Step 3: Replace `src/utils/code-parser/index.ts` with the factory**

```ts
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import type { LoggerAPI } from "../logger";
import { FunctionInfo } from "../functions/types";

export type CodeParserAPI = {
  validateFunction: (
    code: string,
    func: FunctionInfo,
    functionName: string,
  ) => FunctionInfo;
};

export function createCodeParser(
  type: "js" | "ts",
  logger: LoggerAPI,
): CodeParserAPI {
  function makeAst(code: string) {
    return parse(code, {
      sourceType: "module",
      plugins: type === "ts" ? ["typescript"] : [],
    });
  }

  function getDefaultExportName(ast: t.File): string {
    let exportedName = "";

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (!path.container) return;
        logger.debug(path.container);
        if (Array.isArray(path.container)) {
          const exportDeclarations = path.container.filter(
            (node) => node.type === "ExportNamedDeclaration",
          );
          for (const exportDeclaration of exportDeclarations) {
            logger.debug({ exportDeclarations });
            if (!exportDeclarations) return;
            const { specifiers } = exportDeclaration;
            if (specifiers.length > 0) {
              logger.debug("NamedExportDeclaration", specifiers);
              for (const specifier of specifiers) {
                const {
                  local: { name: localName },
                  exported,
                } = specifier as t.ExportSpecifier;
                if (exported) {
                  const { name } = exported as t.Identifier;
                  if (name === "default") {
                    exportedName = localName;
                  }
                }
              }
            }
          }
        }
      },
      ExportDefaultDeclaration(path) {
        if (!path.container) return;
        if (Array.isArray(path.container)) {
          const exportDeclaration = path.container.find(
            (node) => node.type === "ExportDefaultDeclaration",
          );
          if (!exportDeclaration) return;
          const { declaration } = exportDeclaration;
          logger.debug("DefaultExportDeclaration:", declaration);
          const { type: declType } = declaration;
          if (declType === "Identifier") {
            exportedName = (declaration as t.Identifier).name;
          }
          if (declType === "FunctionDeclaration") {
            const { id } = declaration as t.FunctionDeclaration;
            if (!id) return;
            exportedName = id.name;
          }
        }
      },
    });

    return exportedName;
  }

  return {
    validateFunction(code, func, functionName) {
      logger.debug(code);
      let currentFunction: FunctionInfo = { ...func };
      const ast = makeAst(code);
      const exportedName = getDefaultExportName(ast);
      logger.debug(`Function exports ${exportedName} as default`);

      traverse(ast, {
        FunctionDeclaration(path) {
          logger.debug("Checking function declaration");
          if (path.node.id) {
            const { name } = path.node.id;
            logger.debug("FunctionDeclaration:", path.node);
            const isDefaultExport = exportedName === name;
            const matchesName = name === functionName && isDefaultExport;
            const isAsync = path.node.async;
            const valid = isDefaultExport && isAsync;
            currentFunction = {
              ...currentFunction,
              validation: {
                valid,
                info: { isAsync, isDefaultExport, matchesName },
              },
            };
            if (name === functionName) path.stop();
          }
        },
        VariableDeclarator(path) {
          logger.debug("Checking function expression and arrow functions");
          if (
            t.isIdentifier(path.node.id) &&
            (t.isFunctionExpression(path.node.init) ||
              t.isArrowFunctionExpression(path.node.init))
          ) {
            const name = path.node.id.name;
            const isDefaultExport = exportedName === name;
            const isAsync = path.node.init.async;
            const valid = isDefaultExport && isAsync;
            currentFunction = {
              ...currentFunction,
              validation: {
                valid,
                info: { isAsync, isDefaultExport, matchesName: false },
              },
            };
            if (valid) path.stop();
          }
        },
      });

      return currentFunction;
    },
  };
}
```

- [ ] **Step 4: Update the barrel export**

In `src/utils/index.ts`, `CodeParser` is currently exported as a class. Replace:

```ts
import CodeParser from "./code-parser";
// ...
export { CodeParser, ... }
```

With:

```ts
import { createCodeParser } from "./code-parser";
// ...
export { createCodeParser, ... }
```

- [ ] **Step 5: Fix the call site in `src/utils/functions/index.ts`**

Find: `const parser = new CodeParser(type);`
Replace: `const parser = createCodeParser(type, logger);`

Also update the import: `import { createCodeParser } from "..";` (or from `"../code-parser"` directly).

- [ ] **Step 6: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add src/utils/code-parser/index.ts src/utils/index.ts src/utils/functions/index.ts __tests__/code-parser.test.ts
git commit -m "refactor(code-parser): class → createCodeParser factory"
```

---

## Task 7: JsonSchema → plain function

**Files:**

- Modify: `src/utils/json-schema/index.ts`
- Modify: `src/utils/functions/index.ts` (update call site)

**Interfaces:**

- Consumes: `AppDeps`
- Produces: `validateJson(deps: AppDeps, pathToJson: string, schemaURL?: string) => Promise<void>`

No test needed — JsonSchema currently has no tests and `validateJson` has no observable return value (void). The call site change is the deliverable.

- [ ] **Step 1: Replace `src/utils/json-schema/index.ts`**

```ts
import { Schema, validate } from "jtd";
import { RequestHandler } from "../request-handler";
import type { AppDeps } from "../types";

export async function validateJson(
  deps: AppDeps,
  pathToJson: string,
  schemaURL: string = deps.config.schemaURL,
): Promise<void> {
  const request = new RequestHandler(schemaURL);
  const response = await request.get("");
  const schema = await response.json();
  const jsonContent = deps.director.readFile(pathToJson);
  const jsonData = JSON.parse(jsonContent!);
  console.log(schema);
}
```

- [ ] **Step 2: Update call site in `src/utils/functions/index.ts`**

Find:

```ts
import JsonSchema from "../json-schema";
// ...
const jsonSchema = new JsonSchema();
// (JsonSchema is not actually called in the visible code — verify with grep)
```

Run:

```bash
grep -n "jsonSchema\|JsonSchema" src/utils/functions/index.ts
```

If `jsonSchema` is only instantiated but never called (it appears to be unused in the current code), remove the instantiation and import. If it is called, update the call:

```ts
// before:
await jsonSchema.validateJson(pathToJson);
// after:
import { validateJson } from "../json-schema";
await validateJson(deps, pathToJson);
```

- [ ] **Step 3: Remove JsonSchema export from barrel**

In `src/utils/index.ts`, remove `JsonSchema` from imports and exports. Add `validateJson` if it needs to be re-exported.

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/json-schema/index.ts src/utils/functions/index.ts src/utils/index.ts
git commit -m "refactor(json-schema): class → plain function validateJson"
```

---

## Task 8: FunctionsUtils → plain functions

**Files:**

- Modify: `src/utils/functions/index.ts`
- Modify: `src/utils/index.ts`
- Create: `__tests__/functions.test.ts`

**Interfaces:**

- Consumes: `AppDeps`
- Produces: named exported functions: `buildFunctions`, `getFunctions`, `validateFunctions`, `parseName`, `publishFunctions`, `getBuildPath`, `getFunctionFilePath`, `getFunctionJsonFilePath`, `getValidFunctions`, `functionIsExportedAsDefault`, `generateBarrelImportDeclarations`, `generateBarrelFunctionDeclaration`, `generateFunctionsBarrelFile`, `logValidatedFunctions`, `logUploadedFunction`
- Note: `logger.validatedFunctions` and `logger.uploadedFunction` are inlined here as `logValidatedFunctions` and `logUploadedFunction`.
- Note: `logger.success(...)` call sites change to `deps.spinner.success(...)`.

- [ ] **Step 1: Write failing tests**

Create `__tests__/functions.test.ts`:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest --testPathPattern=functions.test --no-coverage
```

Expected: FAIL — `parseName is not a function` (or named export missing)

- [ ] **Step 3: Rewrite `src/utils/functions/index.ts` as plain exported functions**

The full file — replace the class with named exports. Key changes:

- All methods become exported `async function` or `function` declarations
- `deps: AppDeps` replaces `this`
- `logger.success(...)` → `deps.spinner.success(...)`
- `logger.validatedFunctions(...)` → `logValidatedFunctions(deps, ...)`
- `logger.uploadedFunction(...)` → `logUploadedFunction(deps, ...)`
- `new CodeParser(type)` → `createCodeParser(type, deps.logger)` (already done in Task 6)
- `new FusionAuth()` and `new RequestHandler(...)` stay as-is (out of scope)

```ts
import chalk from "chalk";
import esbuild from "esbuild";
import * as fs from "fs";
import path from "path";
import { createCodeParser } from "../code-parser";
import { validateJson } from "../json-schema";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import FormData from "form-data";
import type { AppDeps } from "../types";
import { FunctionInfo, Functions } from "./types";
import { PublishResponse } from "./types";

const functionRegexp = /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/;

export function parseName(name: string): string {
  return name
    .split("-")
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}

export async function buildFunctions(
  deps: AppDeps,
  mode: "ts" | "js" = "ts",
  outdir: string = ".tmp",
  debug: boolean = false,
): Promise<string> {
  deps.logger.debug(
    `Building functions with mode ${mode} in destination ${outdir}`,
  );
  deps.spinner.start("Building functions...");
  const appDir = path.resolve(outdir, "app");
  const functionsOutputDir = path.resolve(appDir, "functions");
  const srcDir = deps.config.srcDir;
  const srcEntryPoint = `${srcDir}/**/*${deps.config.projectExtension}`;

  switch (mode) {
    case "ts":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".ts"),
      });
      break;
    case "js":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".js"),
      });
      break;
  }

  deps.spinner.success("Functions built successfully");
  return appDir;
}

export function getFunctions(deps: AppDeps): Functions {
  const srcDir = deps.config.srcDir;
  deps.logger.debug(`Getting functions in ${srcDir}`);

  const filePaths = deps.director.readDir(srcDir, true);
  const functions: Functions = {};

  filePaths.forEach((filePath) => {
    const match = filePath.match(functionRegexp);
    if (!match) return;
    const [, name, version, , fileType] = match;
    const fullPath = path.resolve(srcDir, name);
    if (!functions[name]) {
      functions[name] = {
        fileType: fileType as "ts" | "js",
        latestVersion: version,
        path: fullPath,
        validation: {
          valid: false,
          info: { isAsync: false, isDefaultExport: false, matchesName: false },
        },
        versions: new Set([version]),
      };
    } else {
      functions[name].versions.add(version);
    }
  });

  // Sort versions descending, set latestVersion
  const sortedFunctions: Functions = {};
  for (const name of Object.keys(functions)) {
    const fn = functions[name];
    const sortedVersions = [...fn.versions].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );
    sortedFunctions[name] = {
      ...fn,
      versions: new Set(sortedVersions),
      latestVersion: sortedVersions[0],
    };
  }

  return sortedFunctions;
}

export function getBuildPath(
  func: FunctionInfo,
  v?: FunctionInfo["latestVersion"],
): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version ?? func.latestVersion, "index.js");
}

export function getFunctionFilePath(func: FunctionInfo, v?: string): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, `index.${func.fileType}`);
}

export function getFunctionJsonFilePath(
  func: FunctionInfo,
  v?: FunctionInfo["latestVersion"],
): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, "function.json");
}

export function functionIsExportedAsDefault(
  deps: AppDeps,
  functionContent: string,
  functionDeclaration: string,
): boolean {
  const exportDefaultRegexp = new RegExp(
    `(export default async function ${functionDeclaration}|${functionDeclaration} as default|export default ${functionDeclaration})`,
    "g",
  );
  deps.logger.debug(`Testing regex pattern: ${exportDefaultRegexp}`);
  return exportDefaultRegexp.test(functionContent);
}

export async function validateFunctions(
  deps: AppDeps,
  functions: Functions,
  type: "js" | "ts" = "ts",
): Promise<Functions> {
  deps.logger.debug(
    `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
  );
  const functionNames = Object.keys(functions);
  let validatedFunctions: Functions = {};

  deps.spinner.start("Validating functions...");
  const parser = createCodeParser(type, deps.logger);

  for (const currentFunctionName of functionNames) {
    const currentFunction = functions[currentFunctionName];
    const functionContent = deps.director.readFile(
      getFunctionFilePath(currentFunction),
    );

    if (!functionContent) {
      validatedFunctions[currentFunctionName] = {
        ...currentFunction,
        validation: { ...currentFunction.validation, valid: false },
      };
      continue;
    }

    const validatedFunction = parser.validateFunction(
      functionContent,
      currentFunction,
      parseName(currentFunctionName),
    );
    validatedFunctions[currentFunctionName] = validatedFunction;
  }

  deps.spinner.success("Functions validated:");
  logValidatedFunctions(deps, validatedFunctions);

  return validatedFunctions;
}

export function logValidatedFunctions(
  deps: AppDeps,
  functions: Functions,
): void {
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const parsedName = parseName(name);
    const {
      latestVersion,
      validation: { valid, info },
    } = currentFunction;
    const prefix = deps.logger.getValidationPrefix(valid);
    const color = deps.logger.getValidationColor(valid);
    const message = color(` - ${prefix} ${name}/${latestVersion}`);
    if (valid) {
      console.log(message);
    } else {
      const { isAsync, isDefaultExport } = info;
      console.log(`${message}: `);
      if (!isDefaultExport) {
        console.log(
          color(
            `\t- Your function name should be '${parsedName}' and it should be defined as a default export!`,
          ),
        );
      }
      if (!isAsync) {
        console.log(color("\t- Your function should return a Promise!"));
      }
    }
  });
}

export function logUploadedFunction(
  deps: AppDeps,
  functionResult: {
    status: string;
    name: string;
    error?: string;
    version: string;
  },
): void {
  const { status, name, error, version } = functionResult;
  const valid = status === "ok";
  const prefix = deps.logger.getValidationPrefix(valid);
  const color = deps.logger.getValidationColor(valid);
  const info = valid ? "successfully published" : error;
  const message = color(` - ${prefix} ${name}/${version}`) + `: ${info}`;
  console.log(message);
}

export function getValidFunctions(functions: Functions): Functions {
  return Object.keys(functions).reduce(
    (acc: Functions, functionName: string) => {
      if (functions[functionName].validation.valid) {
        acc[functionName] = { ...functions[functionName] };
      }
      return acc;
    },
    {},
  );
}

export function getFunctionsJSON(deps: AppDeps, functions: Functions): any[] {
  return Object.keys(functions).map((functionName) => {
    const currentFunction = functions[functionName];
    const { latestVersion, path: functionPath } = currentFunction;
    const functionJSONPath = path.resolve(
      functionPath,
      latestVersion,
      "function.json",
    );
    const functionJSONContent = deps.director.readFile(functionJSONPath) ?? "";
    try {
      const parsedContent = JSON.parse(functionJSONContent);
      return {
        ...parsedContent,
        options: JSON.stringify(parsedContent.options),
        paths: "{}",
        name: functionName,
        version: latestVersion,
      };
    } catch (error) {
      deps.logger.debug(error);
      throw new Error(
        `Unable parse functions JSON for function ${functionName}. Toggle verbose logging with --verbose for more information`,
      );
    }
  });
}

export async function uploadFunctions(
  deps: AppDeps,
  zipPath: string,
  functions: Functions,
): Promise<void> {
  const appUUID = await deps.config.getAppUUID();
  const form = new FormData();
  const functionsJson = getFunctionsJSON(deps, functions);
  form.append("functions", JSON.stringify(functionsJson));
  form.append("options", JSON.stringify({ compile: !deps.config.skipCompile }));
  form.append("file", fs.createReadStream(zipPath));
  const builderAPIURL = await deps.config.builderAPIURL();
  const request = new RequestHandler(builderAPIURL);
  const fusionAuth = new FusionAuth();
  const { token } = await fusionAuth.getToken();
  const response = await request.post(
    `/artifacts/actions/${appUUID}/functions`,
    form,
    { Authorization: `Bearer ${token}` },
  );
  console.log(response.status);
  if (response.status === 409) {
    const { created, updated, deleted } =
      (await response.json()) as PublishResponse;
    created.forEach((result) => logUploadedFunction(deps, result));
    updated.forEach((result) => logUploadedFunction(deps, result));
    deleted.forEach((result) => logUploadedFunction(deps, result));
  }
}

export function generateBarrelImportDeclarations(functions: Functions): string {
  let result = "";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const relativePath = `.${currentFunction.path.replace(process.cwd(), "")}/${latestVersion}`;
    const functionName = parseName(name);
    result += `import { default as ${functionName}_${latestVersion.replace(".", "_")} } from "${relativePath}";\r\n`;
  });
  return result;
}

export function generateBarrelFunctionDeclaration(
  functions: Functions,
): string {
  let result = "const fn = {\r\n";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const functionName = parseName(name);
    const key = `\t"${functionName} ${latestVersion}"`;
    const value = `${functionName}_${latestVersion.replace(".", "_")}`;
    result += `${key}: ${value},\r\n`;
  });
  result += "};\r\n";
  return result;
}

export function generateFunctionsBarrelFile(
  deps: AppDeps,
  outputDir: string,
  functions: Functions,
  fileType: "js" | "ts" = "ts",
): void {
  const validFunctions = getValidFunctions(functions);
  let barrelContent = "";
  barrelContent += generateBarrelImportDeclarations(validFunctions);
  barrelContent += "\r\n";
  barrelContent += generateBarrelFunctionDeclaration(validFunctions);
  barrelContent += "\r\n";
  barrelContent += "export default fn;";
  const outputPath = path.resolve(outputDir, `index.${fileType}`);
  deps.director.writeFile(outputPath, barrelContent);
}
```

**Note on `publishFunctions`:** Copy the existing `publishFunctions` method body from the class verbatim, replacing `this.xxx(...)` with `xxx(deps, ...)` and `logger.uploadedFunction(result)` with `logUploadedFunction(deps, result)`. Read `src/utils/functions/index.ts` in full before writing to get the complete publish logic.

- [ ] **Step 4: Update `src/utils/index.ts` barrel**

Remove `FunctionsUtils` class import/export. Add named function exports:

```ts
import {
  buildFunctions,
  getFunctions,
  validateFunctions,
  parseName,
  uploadFunctions,
  getFunctionsJSON,
  getValidFunctions,
  logValidatedFunctions,
  logUploadedFunction,
  generateFunctionsBarrelFile,
  getFunctionFilePath,
  getBuildPath,
} from "./functions";

// add to exports list:
export {
  buildFunctions,
  getFunctions,
  validateFunctions,
  parseName,
  uploadFunctions,
  getFunctionsJSON,
  getValidFunctions,
  logValidatedFunctions,
  logUploadedFunction,
  generateFunctionsBarrelFile,
  getFunctionFilePath,
  getBuildPath,
  // ... other existing exports
};
```

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/functions/index.ts src/utils/index.ts __tests__/functions.test.ts
git commit -m "refactor(functions): FunctionsUtils class → plain exported functions"
```

---

## Task 9: createGit + extract update utilities

**Files:**

- Modify: `src/utils/git/index.ts`
- Create: `src/utils/update/index.ts`
- Modify: `src/commands/update/index.ts`

**Interfaces:**

- Consumes: `AppDeps`
- Produces:

  - `GitAPI` type, `createGit(deps: AppDeps, cfg: GitTemplateConfig) => GitAPI`
  - `compareVersions(a: string, b?: string) => number` (standalone, formerly static method — no logger dep, uses semver directly)
  - `checkSubmodulesForUpdate(deps: AppDeps) => Promise<void>`
  - `updateSubmodules(deps: AppDeps) => Promise<void>`

- [ ] **Step 1: Write failing test**

Create `__tests__/git.test.ts`:

```ts
import { createGit, compareVersions } from "../src/utils/git";
import { createLogger } from "../src/utils/logger";
import type { AppDeps } from "../src/utils/types";

describe("compareVersions", () => {
  it("returns 1 when a is greater than b", () => {
    expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
  });

  it("returns -1 when a is less than b", () => {
    expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
  });

  it("returns 0 when versions are equal", () => {
    expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
  });
});

describe("createGit", () => {
  it("returns an object with git methods", () => {
    const mockDeps = {
      logger: createLogger({ verbose: false }),
      director: { runCommand: async () => "" } as any,
      prompter: {} as any,
      config: {} as any,
      spinner: {} as any,
    } as AppDeps;

    const git = createGit(mockDeps, { name: "test-repo", path: "/tmp/test" });
    expect(typeof git.getLatestRemoteTag).toBe("function");
    expect(typeof git.handleUpdate).toBe("function");
    expect(typeof git.checkForNewVersion).toBe("function");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx jest --testPathPattern=git.test --no-coverage
```

Expected: FAIL — `createGit is not a function`

- [ ] **Step 3: Replace `src/utils/git/index.ts` with the factory**

```ts
import path from "path";
import semver from "semver";
import type { AppDeps } from "../types";

export type GitTemplateConfig = {
  name: string;
  path: string;
  version?: string;
};

export type GitAPI = {
  getLatestRemoteTag: () => Promise<string | null>;
  getCurrentTag: () => Promise<string | null>;
  getAvailableRemoteTags: () => Promise<string[]>;
  checkForNewVersion: () => Promise<string>;
  handleUpdate: () => Promise<string | null>;
};

export function compareVersions(a: string, b: string = "0.0.0"): number {
  return semver.compare(semver.clean(a) ?? "", semver.clean(b) ?? "");
}

export function createGit(deps: AppDeps, cfg: GitTemplateConfig): GitAPI {
  const repoPath = path.resolve(cfg.path);
  const { name, version } = cfg;

  return {
    async getLatestRemoteTag() {
      deps.logger.debug(`[${name}] Getting latest remote tag for: ${repoPath}`);
      try {
        await deps.director.runCommand("git", ["fetch", "--tags"], {
          cwd: repoPath,
        });
        const tagsOutput = await deps.director.runCommand("git", ["tag"], {
          cwd: repoPath,
        });
        const tags = tagsOutput
          .split("\n")
          .map((tag) => tag.trim())
          .filter((tag) => semver.valid(tag))
          .sort(semver.rcompare);
        return tags[0] ?? null;
      } catch (err) {
        deps.logger.error(`[${name}] Failed to get remote tags:`, err);
        return null;
      }
    },

    async getCurrentTag() {
      try {
        const tag = await deps.director.runCommand(
          "git",
          ["describe", "--tags", "--abbrev=0"],
          { cwd: repoPath },
        );
        return semver.valid(tag) ? tag : null;
      } catch {
        return null;
      }
    },

    async getAvailableRemoteTags() {
      deps.logger.debug("Getting available remote tags");
      const tagsOutput = await deps.director.runCommand(
        "git",
        ["ls-remote", "--tags", "origin"],
        { cwd: repoPath },
      );
      return tagsOutput
        .split("\n")
        .map((line) => {
          const ref = line.split("\t")[1];
          return ref?.match(/refs\/tags\/(.+?)(\^\{\})?$/)?.[1] ?? null;
        })
        .filter(
          (tag): tag is string => Boolean(tag) && Boolean(semver.valid(tag)),
        )
        .sort(semver.rcompare);
    },

    async checkForNewVersion() {
      const git = createGit(deps, cfg);
      const remoteTags = await git.getAvailableRemoteTags();
      const resolvedVersion = remoteTags[0] ?? null;
      if (!resolvedVersion) {
        throw new Error(
          `Unable to fetch latest version from GitHub for ${name}`,
        );
      }
      return resolvedVersion;
    },

    async handleUpdate() {
      const git = createGit(deps, cfg);
      const remoteTags = await git.getAvailableRemoteTags();
      let resolvedVersion: string | null;

      if (!version) {
        deps.logger.warn(
          `[${name}] No version specified. Defaulting to latest available version.`,
        );
        resolvedVersion = remoteTags[0] ? `^${remoteTags[0]}` : null;
      } else if (version.startsWith("^")) {
        const matching = remoteTags
          .filter((tag) => semver.satisfies(tag, version))
          .sort(semver.rcompare);
        resolvedVersion = matching[0] ?? null;
        if (!resolvedVersion) {
          deps.logger.warn(
            `[${name}] No versions match range "${version}". Falling back to latest.`,
          );
          resolvedVersion = remoteTags[0] ?? null;
        }
        resolvedVersion = resolvedVersion ? `^${resolvedVersion}` : null;
      } else {
        const exactMatch = remoteTags.includes(version);
        resolvedVersion = exactMatch ? version : (remoteTags[0] ?? null);
        if (!exactMatch) {
          deps.logger.warn(
            `[${name}] Requested version "${version}" not found. Falling back to: ${resolvedVersion}`,
          );
        }
      }

      if (!resolvedVersion) {
        deps.logger.error(
          `[${name}] No valid versions available. Cannot update.`,
        );
        return null;
      }

      if (resolvedVersion === version) return resolvedVersion;

      // checkout
      try {
        const parsedTag = resolvedVersion.replace("^", "");
        await deps.director.runCommand("git", ["fetch", "--tags"], {
          cwd: repoPath,
        });
        await deps.director.runCommand(
          "git",
          ["checkout", `tags/${parsedTag}`],
          {
            cwd: repoPath,
          },
        );
        deps.spinner.success(`${name} is now at ${parsedTag}.`);
      } catch (err) {
        deps.logger.error(
          `[${name}] Failed to checkout ${resolvedVersion}:`,
          err,
        );
      }

      return resolvedVersion.replaceAll("v", "");
    },
  };
}
```

- [ ] **Step 4: Create `src/utils/update/index.ts`**

These are the two methods extracted from the old Director class:

```ts
import path from "path";
import chalk from "chalk";
import { createGit, compareVersions } from "../git";
import type { AppDeps } from "../types";

export async function checkSubmodulesForUpdate(deps: AppDeps): Promise<void> {
  const logUpdate = (
    name: string,
    currentVersion: string = "none",
    newVersion: string,
  ) =>
    deps.logger.info(
      `New version available for ${name}: ${chalk.redBright(currentVersion)} → ${chalk.greenBright(newVersion)}`,
    );

  const cliPath = deps.director.resolveCLIPath();
  const codegenTemplatesPath = path.resolve(
    cliPath,
    deps.config.scaffolder.templates.path,
  );
  const codegenTemplatesVersion =
    deps.config.scaffolder.templates.versions?.templates;
  const codegenTemplatesName = deps.config.scaffolder.templates.name;

  const codegenTemplates = createGit(deps, {
    name: codegenTemplatesName,
    path: codegenTemplatesPath,
    version: codegenTemplatesVersion,
  });

  const newCodegenTemplatesVersion =
    await codegenTemplates.checkForNewVersion();

  if (
    compareVersions(
      newCodegenTemplatesVersion,
      codegenTemplatesVersion ?? "0.0.0",
    ) === 1
  ) {
    logUpdate(
      codegenTemplatesName,
      codegenTemplatesVersion,
      newCodegenTemplatesVersion,
    );
  }

  await deps.director.runCommand("git", ["submodule", "update", "--init"], {
    cwd: codegenTemplatesPath,
  });

  const { ts: tsProject, js: jsProject } =
    deps.config.scaffolder.templates.functions.project;
  const functionVersions = deps.config.scaffolder.templates.versions?.functions;

  const tsGit = createGit(deps, {
    name: tsProject.name,
    path: path.resolve(codegenTemplatesPath, tsProject.path),
    version: functionVersions?.ts,
  });
  const newTsVersion = await tsGit.checkForNewVersion();
  if (compareVersions(newTsVersion, functionVersions?.ts ?? "0.0.0") === 1) {
    logUpdate(tsProject.name, functionVersions?.ts, newTsVersion);
  }

  const jsGit = createGit(deps, {
    name: jsProject.name,
    path: path.resolve(codegenTemplatesPath, jsProject.path),
    version: functionVersions?.js,
  });
  const newJsVersion = await jsGit.checkForNewVersion();
  if (compareVersions(newJsVersion, functionVersions?.js ?? "0.0.0") === 1) {
    logUpdate(jsProject.name, functionVersions?.js, newJsVersion);
  }
}

export async function updateSubmodules(deps: AppDeps): Promise<void> {
  const cliPath = deps.director.resolveCLIPath();
  const codegenTemplatesPath = path.resolve(
    cliPath,
    deps.config.scaffolder.templates.path,
  );
  const codegenTemplateVersion =
    deps.config.scaffolder.templates.versions?.templates;
  const codegenTemplateName = deps.config.scaffolder.templates.name;

  const codegenGit = createGit(deps, {
    name: codegenTemplateName,
    path: codegenTemplatesPath,
    version: codegenTemplateVersion,
  });
  const newCodegenVersion = await codegenGit.handleUpdate();

  if (newCodegenVersion) {
    if (codegenTemplateVersion !== newCodegenVersion) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
    }
  } else {
    deps.logger.warn(
      `Unable to retrieve a new version for ${codegenTemplateName}!`,
    );
  }

  await deps.director.runCommand("git", ["submodule", "update", "--init"], {
    cwd: codegenTemplatesPath,
  });

  const { ts: tsProject, js: jsProject } =
    deps.config.scaffolder.templates.functions.project;
  const functionVersions = deps.config.scaffolder.templates.versions?.functions;

  const tsGit = createGit(deps, {
    name: tsProject.name,
    path: path.resolve(codegenTemplatesPath, tsProject.path),
    version: functionVersions?.ts,
  });
  const newTsVersion = await tsGit.handleUpdate();

  if (newTsVersion) {
    if (newTsVersion !== functionVersions?.ts) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
    }
  } else {
    deps.logger.warn(
      "The submodule bb-generic-actions-typescript did not yield a version!",
    );
  }

  const jsGit = createGit(deps, {
    name: jsProject.name,
    path: path.resolve(codegenTemplatesPath, jsProject.path),
    version: functionVersions?.js,
  });
  const newJsVersion = await jsGit.handleUpdate();

  if (newJsVersion) {
    if (newJsVersion !== functionVersions?.js) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
    }
  } else {
    deps.logger.warn(
      "The submodule bb-generic-actions did not yield a version!",
    );
  }

  deps.config.saveConfig();
}
```

- [ ] **Step 5: Update `src/commands/update/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../utils";
import { checkSubmodulesForUpdate, updateSubmodules } from "../../utils/update";

const update = new Command("update");

update
  .command("install")
  .description("Update the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await updateSubmodules(deps);
    }),
  );

update
  .command("check")
  .description("Check for new updates for the CLI and it's submodules")
  .action(
    withErrorHandling(async () => {
      await checkSubmodulesForUpdate(deps);
    }),
  );

export default update;
```

- [ ] **Step 6: Update `src/utils/index.ts` — remove Git class export, add createGit**

Replace:

```ts
import Git from "./git";
// ...
export { Git, ... }
```

With:

```ts
import { createGit, compareVersions } from "./git";
// ...
export { createGit, compareVersions, ... }
```

- [ ] **Step 7: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 8: Commit**

```bash
git add src/utils/git/index.ts src/utils/update/index.ts src/commands/update/index.ts src/utils/index.ts __tests__/git.test.ts
git commit -m "refactor(git): class → createGit factory; extract update utilities"
```

---

## Task 10: createGraphQLAPI

**Files:**

- Modify: `src/utils/gql-api/index.ts`
- Modify: `src/utils/index.ts`

**Interfaces:**

- Consumes: `AppDeps`
- Produces: `GraphQLAPIAPI` type (name it `GqlAPI`), `createGraphQLAPI(deps: AppDeps) => GqlAPI`
- Note: `GraphQLAPI` is NOT a singleton — it's instantiated per-use in commands. `createGraphQLAPI` replaces `new GraphQLAPI()`. Do not add it to AppDeps.

No new tests — GraphQLAPI has no existing tests and its methods require network/keychain access. The structural change (class → factory) is the deliverable.

- [ ] **Step 1: Read the full `src/utils/gql-api/index.ts`**

```bash
cat src/utils/gql-api/index.ts
```

- [ ] **Step 2: Rewrite `src/utils/gql-api/index.ts` as a factory**

Key changes:

- `private jwtToken`, `refreshToken`, `accessTokenExpiresAt` become closure variables `let _jwt`, `let _refresh`, `let _expiresAt`
- All methods on the class become methods on the returned object
- `config`, `logger`, `prompter` come from `deps` parameter instead of barrel imports
- Signature: `export function createGraphQLAPI(deps: AppDeps): GqlAPI`

```ts
import { config, logger, prompter } from "../index"; // REMOVE these
// Replace with:
import type { AppDeps } from "../types";
import {
  GraphQLErrorPayload,
  AuthenticationSuccessPayload,
  GraphQLAccessToken,
  AuthenticationTokenPayload,
  GraphQLResponse,
} from "./types/index";
import { getToken, saveToken } from "../keychain/index";
import { ActionObject, AllowedActionInputTypes } from "../types";

export type GqlAPI = {
  getAccessTokens: () => Promise<GraphQLAccessToken | undefined>;
  getTokensFromKeychain: () => Promise<GraphQLAccessToken | undefined>;
  validateAccessToken: () => boolean;
  login: (options?: {
    option?: string;
    apiURL?: string;
    authProfileUUID?: string;
  }) => Promise<GraphQLAccessToken | undefined>;
  request: <D = any>(
    body: Record<string, any>,
    url: string,
    headers?: Record<string, string>,
  ) => Promise<GraphQLResponse<D>>;
};

export function createGraphQLAPI(deps: AppDeps): GqlAPI {
  let _jwt = "";
  let _refresh = "";
  let _expiresAt: number | null = null;

  // Copy all method bodies verbatim from the class, replacing:
  //   this.jwtToken → _jwt
  //   this.refreshToken → _refresh
  //   this.accessTokenExpiresAt → _expiresAt
  //   config → deps.config
  //   logger → deps.logger
  //   prompter → deps.prompter
  //   this.methodName(...) → api.methodName(...)

  const api: GqlAPI = {
    async getAccessTokens() {
      return await api.getTokensFromKeychain();
    },
    // ... (copy remaining methods)
  };

  return api;
}
```

**Important:** Read the full `gql-api/index.ts` before writing — copy every method body exactly, only replacing `this.*`, `config`, `logger`, `prompter` references.

- [ ] **Step 3: Update `src/utils/index.ts`**

Remove:

```ts
import GraphQLAPI from "./gql-api";
export { GraphQLAPI, ... }
```

Add:

```ts
import { createGraphQLAPI } from "./gql-api";
export { createGraphQLAPI, ... }
```

- [ ] **Step 4: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add src/utils/gql-api/index.ts src/utils/index.ts
git commit -m "refactor(gql-api): GraphQLAPI class → createGraphQLAPI factory"
```

---

## Task 11: Scaffolders → composition

**Files:**

- Modify: `src/utils/scaffolder/index.ts`
- Modify: `src/utils/scaffolder/functions/index.ts`
- Modify: `src/utils/scaffolder/components/index.ts`
- Modify: `src/utils/index.ts`

**Interfaces:**

- Consumes: `AppDeps`
- Produces from `src/utils/scaffolder/index.ts`: `copyTemplateFromLocal(deps, templatePath, destPath, force)`, `downloadTemplate(deps, url, cloneLocation, force)`
- Produces from `src/utils/scaffolder/functions/index.ts`: `generateProject`, `generateFunction`, `generateNewFunction`, `generateCodeGenFile`, `generateFunctionsBarrelFile`, `generateTest`
- Produces from `src/utils/scaffolder/components/index.ts`: `generateProject`, `generateComponent`
- Note: `logger.success(...)` call sites → `deps.spinner.success(...)`

- [ ] **Step 1: Rewrite `src/utils/scaffolder/index.ts`**

```ts
import { cp, rm, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import degit from "degit";
import { isErrorWithCode } from "..";
import type { AppDeps } from "../types";

export async function copyTemplateFromLocal(
  deps: AppDeps,
  templatePath: string,
  destinationPath: string,
  force: boolean,
): Promise<string | undefined> {
  deps.logger.debug(
    `Copying template from ${templatePath} to ${destinationPath}`,
  );
  deps.spinner.update(`Copying template from ${path.basename(templatePath)}`);
  deps.spinner.start();

  try {
    const destinationExists = existsSync(destinationPath);
    if (destinationExists) {
      const destinationStats = await stat(destinationPath);
      if (destinationStats.isDirectory() && !force) {
        throw new Error("Destination is not empty! Use --force to overwrite.");
      }
      if (force) {
        deps.logger.debug(`Force enabled — cleaning up ${destinationPath}`);
        await rm(destinationPath, { recursive: true, force: true });
      }
    }
    await cp(templatePath, destinationPath, { recursive: true });
    deps.logger.debug(`Template copied to ${destinationPath}`);
  } catch (err) {
    deps.spinner.stop();
    deps.logger.error("Error copying template!");
    if (isErrorWithCode(err) && err.code === "ENOENT") {
      throw new Error(`Template path not found: ${templatePath}`);
    }
    throw new Error(err instanceof Error ? err.message : JSON.stringify(err));
  }

  deps.spinner.success("Template copied successfully");
  return destinationPath;
}

export async function downloadTemplate(
  deps: AppDeps,
  url: string,
  cloneLocation: string,
  force: boolean,
): Promise<string | undefined> {
  deps.logger.debug(`Downloading template at ${url}`);
  const downloader = degit(url, { force });
  deps.spinner.update(`Downloading template at ${url}`);
  deps.spinner.start();

  try {
    await downloader.clone(cloneLocation);
    deps.logger.debug(`Template downloaded and saved at ${cloneLocation}`);
  } catch (err) {
    deps.spinner.stop();
    deps.logger.error("Error downloading template!");
    if (isErrorWithCode(err)) {
      if (err.code === "DEST_NOT_EMPTY") {
        throw new Error("Destination is not empty! Use --force to overwrite.");
      }
      if (err.code === "COULD_NOT_DOWNLOAD") {
        throw new Error(
          "Unable to download template! Try --verbose for more info.",
        );
      }
    }
    throw new Error(JSON.stringify(err));
  }

  deps.spinner.success("Template downloaded successfully");
  return cloneLocation;
}
```

- [ ] **Step 2: Rewrite `src/utils/scaffolder/functions/index.ts`**

Read the full file first (`cat src/utils/scaffolder/functions/index.ts`), then replace the class with named exported functions. Key changes:

- `extends BaseScaffolder` removed
- `this.downloadTemplate(...)` → `downloadTemplate(deps, ...)`
- `this.copyTemplateFromLocal(...)` → `copyTemplateFromLocal(deps, ...)`
- `new FunctionsUtils()` → call `parseName`, `getValidFunctions`, `generateBarrelImportDeclarations`, `generateBarrelFunctionDeclaration` directly (all plain functions now)
- `logger.success(msg)` → `deps.spinner.success(msg)`
- All methods become: `export async function generateProject(deps: AppDeps, name: string, javascript?: boolean): Promise<void>`

- [ ] **Step 3: Rewrite `src/utils/scaffolder/components/index.ts`**

```ts
import { downloadTemplate } from "..";
import type { AppDeps } from "../..";

export async function generateProject(
  deps: AppDeps,
  name: string,
  force: boolean,
): Promise<void> {
  const templateUrl = deps.config.scaffolder.templates.components.project.url;
  await downloadTemplate(deps, templateUrl, name, force);
  deps.logger.info(
    `Components project "${name}" created!

  To start developing:
  - cd ${name}
  - npm install
  - npm run dev
    `,
  );
}

export async function generateComponent(
  deps: AppDeps,
  name: string,
): Promise<void> {
  deps.logger.info(`Creating a new component: ${name}`);
}
```

- [ ] **Step 4: Update `src/utils/index.ts`**

Remove class imports/exports for `ComponentsScaffolder`, `FunctionsScaffolder`, `BaseScaffolder`. Export the named functions instead:

```ts
import {
  generateProject as generateFunctionsProject,
  generateFunction,
  generateCodeGenFile,
  generateFunctionsBarrelFile as generateFunctionsBarrel,
  generateTest,
} from "./scaffolder/functions";

import {
  generateProject as generateComponentsProject,
  generateComponent,
} from "./scaffolder/components";

import { downloadTemplate, copyTemplateFromLocal } from "./scaffolder";
```

- [ ] **Step 5: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 6: Commit**

```bash
git add src/utils/scaffolder/ src/utils/index.ts
git commit -m "refactor(scaffolder): class hierarchy → plain functions with composition"
```

---

## Task 12: Update commands to use deps

**Files:**

- Modify: `src/commands/functions/build/index.ts`
- Modify: `src/commands/functions/init/index.ts`
- Modify: `src/commands/functions/new/index.ts`
- Modify: `src/commands/functions/validate/index.ts`
- Modify: `src/commands/functions/publish/index.ts`
- Modify: `src/commands/functions/bump/index.ts`
- Modify: `src/commands/functions/gen/types/index.ts`
- Modify: `src/commands/functions/gen/test/index.ts`
- Modify: `src/commands/components/init/index.ts`
- Modify: `src/commands/components/new/index.ts`

**Interfaces:**

- Consumes: `deps` from `../../utils` (or `../../../utils`)
- All `new FunctionsScaffolder()`, `new ComponentsScaffolder()`, `new FunctionsUtils()`, `new GraphQLAPI()` → replaced with direct function calls using `deps`

**Pattern for each command:**

```ts
// Before:
import { withErrorHandling, FunctionsUtils, FunctionsScaffolder, ... } from "../../../utils";
// ...
withErrorHandling(async (options) => {
  const functionsUtils = new FunctionsUtils();
  const functionsScaffolder = new FunctionsScaffolder();
  await functionsUtils.buildFunctions(...)
  await functionsScaffolder.generateProject(...)
})

// After:
import { withErrorHandling, deps, buildFunctions, getFunctions } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/functions";
// ...
withErrorHandling(async (options) => {
  await buildFunctions(deps, ...)
  await generateProject(deps, ...)
})
```

- [ ] **Step 1: Update `src/commands/functions/build/index.ts`**

```ts
import { Command } from "commander";
import {
  withErrorHandling,
  deps,
  buildFunctions,
  getFunctions,
  validateFunctions,
  generateFunctionsBarrelFile,
} from "../../../utils";
import path from "path";

const buildFunctionsCmd = new Command("build")
  .description("Build your functions")
  .option("-d, --destination <path>")
  .option("--debug", "Outputs a non minified version for debugging purposes")
  .action(
    withErrorHandling(async (options) => {
      const appDir = path.resolve(deps.config.buildDir, "app");
      const functions = getFunctions(deps);
      const validated = await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );
      generateFunctionsBarrelFile(deps, appDir, validated, "js");
      await buildFunctions(
        deps,
        deps.config.isTypescript ? "ts" : "js",
        options.destination,
        options.debug,
      );
    }),
  );

export default buildFunctionsCmd;
```

- [ ] **Step 2: Update `src/commands/functions/init/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/functions";

const initFunction = new Command("init")
  .arguments("<name>")
  .option("--j, --javascript", "Use vanilla JavaScript")
  .description("Initialize a new TypeScript functions project")
  .option(
    "-f, --force",
    "Overwrites project if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      await generateProject(deps, name, options.javascript);
      deps.director.changeDir(name);
      deps.spinner.start("Installing dependencies...");
      await deps.director.runCommand("npm", ["i"], { stdio: "ignore" });
      deps.spinner.success("Dependencies installed");
      deps.logger.info(
        `Functions project "${name}" created!\n\n  To start developing:\n  - cd ${name}\n  - bbs functions publish\n    `,
      );
    }),
  );

export default initFunction;
```

- [ ] **Step 3: Update `src/commands/functions/new/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateFunction } from "../../../utils/scaffolder/functions";

const newFunction = new Command("new")
  .arguments("<name>")
  .description("Initialize a new function")
  .option(
    "-f, --force",
    "Overwrites function if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      await generateFunction(deps, name);
    }),
  );

export default newFunction;
```

- [ ] **Step 4: Update `src/commands/functions/validate/index.ts`**

```ts
import { Command } from "commander";
import {
  withErrorHandling,
  deps,
  getFunctions,
  validateFunctions,
} from "../../../utils";

const validateFunctionsCmd = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const functions = getFunctions(deps);
      await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );
    }),
  );

export default validateFunctionsCmd;
```

- [ ] **Step 5: Update `src/commands/functions/publish/index.ts`**

```ts
import { Command } from "commander";
import path from "path";
import {
  withErrorHandling,
  deps,
  getFunctions,
  validateFunctions,
  getValidFunctions,
  buildFunctions,
  uploadFunctions,
  generateFunctionsBarrelFile,
} from "../../../utils";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .action(
    withErrorHandling(async () => {
      const appDir = path.resolve(deps.config.buildDir, "app");
      const functions = getFunctions(deps);
      const validated = await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );
      const valid = getValidFunctions(validated);
      generateFunctionsBarrelFile(deps, appDir, valid, "js");
      await buildFunctions(
        deps,
        deps.config.isTypescript ? "ts" : "js",
        undefined,
        true,
      );
      const outputZipPath = path.resolve(deps.config.buildDir, "app.zip");
      await deps.director.zipDir(appDir, outputZipPath);
      deps.director.removeDir(appDir);
      await uploadFunctions(deps, outputZipPath, valid);
    }),
  );

export default publishFunction;
```

- [ ] **Step 6: Update `src/commands/functions/bump/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { bumpFunction } from "../../../utils/scaffolder/functions";

const bumpFunctionCmd = new Command("bump")
  .description("Create a new version for a function")
  .action(
    withErrorHandling(async () => {
      await bumpFunction(deps);
    }),
  );

export default bumpFunctionCmd;
```

- [ ] **Step 7: Update `src/commands/functions/gen/types/index.ts`**

Replace `new FunctionsScaffolder()` with scaffolder functions and `new GraphQLAPI()` with `createGraphQLAPI(deps)`:

```ts
import { createGraphQLAPI } from "../../../../utils/gql-api";
// ...
const gqlAPI = createGraphQLAPI(deps);
```

- [ ] **Step 8: Update `src/commands/functions/gen/test/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../../utils";
import { generateTestFiles } from "../../../../utils/scaffolder/functions";

const genTest = new Command("test")
  .option(
    "-f, --force",
    "Overwrites test if it already exists. Use with caution!",
  )
  .description("Generate test files for a selected function")
  .action(
    withErrorHandling(async (options) => {
      await generateTestFiles(deps, undefined, options.force);
    }),
  );

export default genTest;
```

- [ ] **Step 9: Update `src/commands/components/init/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/components";

const initComponents = new Command("init")
  .arguments("<name>")
  .description("Initialize a new components project")
  .option("-f, --force", "Overwrites project if it already exists.")
  .action(
    withErrorHandling(async (name, options) => {
      await generateProject(deps, name, options.force ?? false);
    }),
  );

export default initComponents;
```

- [ ] **Step 10: Update `src/commands/components/new/index.ts`**

```ts
import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateComponent } from "../../../utils/scaffolder/components";

const newComponent = new Command("new <name>")
  .description("Initialize a new component")
  .action(
    withErrorHandling(async (name) => {
      await generateComponent(deps, name);
    }),
  );

export default newComponent;
```

- [ ] **Step 11: Run all tests**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 12: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 13: Commit**

```bash
git add src/commands/
git commit -m "refactor(commands): replace class instantiation with direct function calls using deps"
```

---

## Task 13: Cleanup

**Files:**

- Modify: `src/utils/index.ts` — remove any remaining class constructor exports, dead imports
- Audit remaining `new` usage across src/

- [ ] **Step 1: Check for remaining class instantiations**

```bash
grep -rn "new [A-Z]" src/ --include="*.ts" | grep -v "FusionAuth\|RequestHandler\|Error\|Set\|Map\|Date\|FormData\|Promise\|RegExp"
```

Expected: no results (other than FusionAuth and RequestHandler which are out of scope)

- [ ] **Step 2: Check for remaining class definitions**

```bash
grep -rn "^export default class\|^export class\|^class " src/ --include="*.ts"
```

Expected: no results (except FusionAuth and RequestHandler)

- [ ] **Step 3: Remove dead barrel exports**

Clean up `src/utils/index.ts` — remove any unused imports or stale exports from the migration.

- [ ] **Step 4: Run all tests one final time**

```bash
npx jest --no-coverage
```

Expected: all pass

- [ ] **Step 5: TypeScript compile check**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/utils/index.ts
git commit -m "chore: cleanup dead class exports after FP refactor"
```
