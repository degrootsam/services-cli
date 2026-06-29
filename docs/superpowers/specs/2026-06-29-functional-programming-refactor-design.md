# Functional Programming Refactor

**Date:** 2026-06-29  
**Status:** Approved

## Problem

The codebase uses 13 classes, most of which are stateless groups of methods. Class-based structure makes testing hard: tests must instantiate classes, manage singleton state, and use `jest.mock()` to override module-level singletons. The goal is to replace classes with plain functions and factory functions, using explicit dependency injection for testability.

## Approach

Context object (AppDeps) pattern. Every function that needs infrastructure receives a `deps: AppDeps` object as its first parameter. No hidden singleton imports inside utility modules. Stateful things are built by factory functions that close over their state.

## AppDeps Type + Assembly

```ts
// src/utils/types.ts
export type AppDeps = {
  logger: LoggerAPI;
  director: DirectorAPI;
  prompter: PrompterAPI;
  config: ConfigAPI;
  spinner: Spinner;
};
```

Assembly in `src/utils/index.ts`:

```ts
const logger = createLogger({ verbose: !!verboseArg });
const director = createDirector(logger);
const prompter = createPrompter(logger);
const config = createConfig(
  { force: !!forceArg },
  { director, logger, prompter },
);

export const deps: AppDeps = { logger, director, prompter, config, spinner };
```

Each factory takes only the deps it needs — no circular references.

## Class Migration Map

### Stateless classes → function modules

These classes have no meaningful state. They become modules of plain exported functions. Where they need `logger`, they receive it via a factory that closes over it.

| Class            | Strategy                                                           |
| ---------------- | ------------------------------------------------------------------ |
| `Director`       | `createDirector(logger): DirectorAPI` — closes over logger         |
| `Prompter`       | `createPrompter(logger): PrompterAPI` — closes over logger         |
| `CodeParser`     | `createCodeParser(fileType): CodeParserAPI` — closes over fileType |
| `JsonSchema`     | Plain exported functions, no factory needed                        |
| `FunctionsUtils` | Plain exported functions accepting `deps: AppDeps`                 |

### Stateful classes → factory functions

These classes have internal state (flags, cached values, tokens). They become factory functions whose returned plain objects close over that state.

**Logger:**

```ts
export function createLogger({
  verbose = false,
}: {
  verbose?: boolean;
}): LoggerAPI {
  let _verbose = verbose;
  return {
    debug(...msg) {
      if (_verbose) console.debug(DEBUG_PREFIX, ...msg);
    },
    toggleVerbose(v) {
      _verbose = v;
    },
    error,
    info,
    warn,
    success, // ...
  };
}
```

**ConfigManager → createConfig:**

- Internal state: `_data` (config record), `_updated` (dirty flag), `_isTs` (detected at init)
- `updateConfig(partial)` mutates `_data` in place — same behaviour as today
- All getters (`srcDir`, `buildDir`, `app`, etc.) become `get` accessors on the returned object
- `saveConfig`, `getAppUUID`, `getAppIdentifier`, `getApiURL`, `builderAPIURL` become methods
- `isTypescript: boolean` and `force: boolean` are exposed as plain properties on the returned object

**GraphQLAPI → createGraphQLAPI(deps):**

- Token state (jwtToken, refreshToken, accessTokenExpiresAt) lives in closure
- Same method interface: `login`, `query`, `getAccessTokens`, `validateAccessToken`

**Git → createGit(deps, cfg):**

- Not a singleton — instantiated per repo at call site
- `cfg: GitTemplateConfig` (name, path, version) replaces constructor args
- Same method interface: `getLatestRemoteTag`, `getCurrentTag`, `handleUpdate`, `checkForNewVersion`, `compareVersions` (static → standalone exported function)

### Inheritance → composition

`BaseScaffolder → FunctionsScaffolder + ComponentsScaffolder` is the only inheritance chain.

Shared methods (`copyTemplateFromLocal`, `downloadTemplate`) move to `src/utils/scaffolder/index.ts` as plain exported functions accepting `deps: AppDeps`. Each scaffolder module imports them directly:

```ts
// src/utils/scaffolder/functions/index.ts
import { downloadTemplate, copyTemplateFromLocal } from "..";

export async function generateProject(
  deps: AppDeps,
  name: string,
  javascript = false,
) {
  const url = javascript
    ? deps.config.scaffolder.templates.functions.project.js.url
    : deps.config.scaffolder.templates.functions.project.ts.url;
  await downloadTemplate(deps, url, name, deps.config.force);
}
```

No `extends`, no `this`, no `super`.

## Commands

Commands become exported async functions that receive `deps` and their specific options:

```ts
// src/commands/functions/build/index.ts
export async function buildCommand(deps: AppDeps, opts: BuildOptions) {
  await buildFunctions(deps, deps.config.isTypescript ? "ts" : "js");
}
```

CLI wiring in `src/index.ts` passes the assembled `deps` singleton:

```ts
program
  .command("build")
  .action(withErrorHandling(() => buildCommand(deps, {})));
```

`withErrorHandling` remains in `src/utils/index.ts` where `deps` is already in scope.

## Testing

No class instantiation, no module-level singleton patching. Tests build a minimal mock deps object:

```ts
const mockDeps: AppDeps = {
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    toggleVerbose: jest.fn(),
  },
  config: {
    srcDir: "functions",
    buildDir: ".tmp",
    projectExtension: ".ts",
    force: false,
  } as ConfigAPI,
  director: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    runCommand: jest.fn(),
    exists: jest.fn(),
  },
  prompter: { input: jest.fn(), confirm: jest.fn(), select: jest.fn() },
  spinner: {
    start: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    update: jest.fn(),
  },
};
```

Each test provides only the fields it cares about. No hidden state, no side effects between tests.

## File Structure

No files move. Every `src/utils/*/index.ts` keeps its path. Internal shape changes:

- `class Foo { ... }` → `export function createFoo(...)` + `export type FooAPI = { ... }`
- `export default class` → named exports
- `src/utils/index.ts` wires factories instead of `new` constructors

## Out of Scope

- No changes to external interfaces (CLI commands, config.json format)
- No changes to test framework (Jest stays)
- No changes to build pipeline
- `FusionAuth` and `RequestHandler` follow same pattern but are lower priority (less tested)
