# bbs.config.ts design

## Problem

The CLI currently sources config from `config.json`, which it generates and
partially rewrites on every command run (`saveConfig()` in
`src/utils/config/index.ts`). This is being rebuilt: users should instead
author a `bbs.config.ts` file that exports a `createConfig(...)` call. Any
existing `config.json` (from the CLI being rebuilt) must remain readable but
must never be written to again.

## Goals

- Replace hand-edited/generated `config.json` with a type-checked,
  code-based `bbs.config.ts`.
- Never write to user-authored config files (`config.json`, `bbs.config.ts`).
- Preserve backward compatibility: existing `config.json` values still load
  if present.
- Keep a place for CLI-owned, runtime-mutable state (resolved app identity,
  template version pins) that the CLI can freely persist.

## Non-goals

- Migrating/deleting existing `config.json` files automatically.
- Supporting arbitrary async/dynamic logic inside `bbs.config.ts` beyond a
  plain object literal passed to `createConfig`.
- Changing the `scaffolder` config's shape or template mechanics.

## Architecture

### Public `createConfig` helper

A new, publicly exported, Vite-`defineConfig`-style identity function:

```ts
export type BbsUserConfig = {
  app?: Partial<Config["app"]>;
  options?: DeepPartial<Config["options"]>;
  buildOptions?: Config["buildOptions"];
};

export function createConfig(config: BbsUserConfig): BbsUserConfig {
  return config;
}
```

Exported from the CLI package root so a project's `bbs.config.ts` can do:

```ts
import { createConfig } from "bbs-cli";

export default createConfig({
  app: { uuid: "...", identifier: "...", zone: "eu" },
  options: { env: "production" },
});
```

`scaffolder` is intentionally excluded from `BbsUserConfig` — it's internal
machinery (template repo URLs, cache paths, version pins), never
hand-authored today, and stays sourced from `DEFAULT_CONFIG` +
`.bbs/state.json` only.

### Naming collision

`src/utils/config/index.ts` already exports an internal `createConfig(...)`
— the `ConfigAPI` bootstrap constructor called once at CLI startup
(`src/utils/index.ts:53`). This must be renamed to `bootstrapConfig` to free
up the `createConfig` name for the new public helper.

### Merge precedence

At bootstrap, config layers merge in this order (later overrides earlier):

```
DEFAULT_CONFIG  <  .bbs/state.json  <  config.json (legacy, read-only)  <  bbs.config.ts
```

- `DEFAULT_CONFIG`: existing hardcoded defaults (`src/utils/config/index.ts:26-89`).
- `.bbs/state.json`: CLI-owned bookkeeping (see below). Fills gaps when the
  user hasn't set a value explicitly.
- `config.json`: legacy file, read-only. Parsed and deep-merged exactly like
  today. Malformed JSON → warn, skip this layer, continue.
- `bbs.config.ts`: the new primary, user-authored source. Always wins on
  conflict.

### Loading `bbs.config.ts`

The CLI binary moves to run under Bun (`#!/usr/bin/env bun`), which natively
imports `.ts` files with no separate transpile step. Loading is a plain
dynamic import:

```ts
const configPath = path.resolve(cwd, "bbs.config.ts");
if (existsSync(configPath)) {
  const mod = await import(pathToFileURL(configPath).href);
  userConfig = mod.default;
}
```

- File missing → skip this layer entirely (optional file).
- File present but throws during import, or has no valid `default` export →
  hard error, abort startup. Unlike legacy `config.json`, this is now the
  primary config surface — silently falling back to defaults would mask real
  mistakes in the user's own TypeScript.

### `.bbs/state.json` — CLI-owned mutable state

New file at `<project-root>/.bbs/state.json`, fully owned by the CLI:

- `app.uuid` / `app.identifier`: written when resolved via the interactive
  login/prompt flow (today this happens in `getAppUUID`/`getAppIdentifier`,
  `src/utils/config/index.ts:253-269`, via `updateConfig()` + `saveConfig()`).
- `scaffolder.templates.versions`: written after template sync/update
  (today via `updateConfig()` calls in `src/utils/update/index.ts:95-150`
  followed by `saveConfig()` at line 157).

This is the only file the CLI writes to automatically going forward.

### Removed behavior

- `ConfigAPI.saveConfig` / the full/partial config.json rewrite path
  (`src/utils/config/index.ts:234-251`) is removed. Nothing user-facing gets
  auto-rewritten.
- `withErrorHandling` (`src/utils/index.ts:65`) calls `state.saveState()`
  instead of `config.saveConfig()`.
- `updateSubmodules` (`src/utils/update/index.ts:157`) calls
  `state.saveState()` instead of `config.saveConfig()`.
- `getAppUUID`/`getAppIdentifier` call `updateState()` instead of
  `updateConfig()` when prompting for missing values.

## Scaffolding

`bbs functions init` and `bbs components init` now write a starter
`bbs.config.ts` as part of project scaffolding (same file-write mechanism
scaffolder already uses for other templated files), pre-filled with:

- `app` values collected during the init prompts.
- Sensible `options` defaults (mirroring today's `DEFAULT_CONFIG` shape).

## Error handling summary

| Source            | Missing        | Malformed / invalid                    |
| ----------------- | -------------- | -------------------------------------- |
| `config.json`     | skip layer     | warn, skip layer (existing behavior)   |
| `bbs.config.ts`   | skip layer     | hard error, abort                      |
| `.bbs/state.json` | treat as empty | warn, skip layer (same as config.json) |

## Testing

- Merge precedence: each layer overrides the previous one, in order.
- `bbs.config.ts` missing → clean skip, no error.
- `bbs.config.ts` throws on import, or has no `default` export → CLI exits
  with a clear error.
- `.bbs/state.json` read/write is isolated — never reads from or writes to
  `config.json` or `bbs.config.ts`.
- Rewrite `src/__tests__/config.test.ts` around the new `loadConfig` /
  `bootstrapConfig` / state-module split.

## Open items for implementation planning

- Exact module layout for the new state module (likely
  `src/utils/state/index.ts` mirroring `src/utils/config/index.ts`'s
  existing shape).
- `readme.md` needs updating to document `bbs.config.ts` +
  `createConfig()` in place of the current `config.json` contract
  (`readme.md:48-75`).
- Whether scaffolder should also add `.bbs/` to a generated `.gitignore`.
