# Replace esbuild and npm with Bun

## Problem

The CLI is already moving to Bun as its runtime (native TS execution of
`bbs.config.ts`, `bun:test` for the test suite). Two things still lag behind
that move: a dead `esbuild` type import (function _bundling_ itself already
moved to `Bun.build`), and several places — both at CLI runtime and in this
repo's own dev tooling — that still shell out to or document `npm`.

## Goals

- Remove every remaining reference to `esbuild` (dependency + dead type
  import).
- Replace every `npm` invocation the CLI performs on a user's behalf
  (scaffolding, dependency install, type generation) with the Bun
  equivalent.
- Replace this repo's own dev tooling (`package.json` scripts references in
  docs, lockfile, doc instructions) with Bun equivalents.

## Non-goals

- Replacing `node` invocations that aren't package-manager or bundler calls
  (`"release": "node scripts/create-release-tag.js"` stays as-is — it's a
  release script's runtime, not npm or esbuild).
- Any change to the actual function-bundling behavior in
  `src/utils/functions/build.ts` — it already uses `Bun.build` and needs no
  changes.
- Removing unrelated, still-used dev dependencies (e.g. `ts-node`, even
  though it's currently unused — out of scope for this change).

## Changes

### 1. Remove esbuild

- `src/utils/config/types/index.ts`: delete the unused `transform?:
TransformOptions` field from `ScaffolderConfig["tests"]` and the `import {
TransformOptions } from "esbuild"` it required. Confirmed via
  repo-wide grep that `scaffolder.tests.transform` is never read anywhere —
  this is dead code, not a behavior change.
- `package.json`: remove the `esbuild` dependency and the
  `@esbuild/linux-x64` optional dependency.

### 2. Runtime npm → bun shell-outs

- `src/commands/functions/init/index.ts:20`: `runCommand("npm", ["i"], ...)`
  → `runCommand("bun", ["install"], ...)`.
- `src/commands/functions/gen/types/index.ts`:
  - Prompt option label `"Initialize empty npm project (npm init)"` →
    `"Initialize empty project (bun init)"`.
  - `runCommand("npm", ["init"], { stdio: "inherit" })` →
    `runCommand("bun", ["init", "-y"], { stdio: "inherit" })`. `bun init -y`
    scaffolds a small starter project (index.ts, tsconfig.json, README,
    .gitignore) rather than emitting a bare package.json the way `npm init`
    does — accepted as a minor side effect of the swap, not worked around.
  - The dependency-install loop's per-package `npm i ${dependency}` shell
    command → `bun add ${dependency}`, with the existing `-D` dev-flag
    convention in the hardcoded dependency list translated to Bun's `-d`
    flag (e.g. `-D @graphql-codegen/typescript` → `-d
@graphql-codegen/typescript`). The surrounding loop logic (require.resolve
    check to skip already-installed packages) is unchanged.
  - `runCommand("npm", ["run", "generate-types"])` → `runCommand("bun",
["run", "generate-types"])`.

### 3. This repo's own dev tooling

- Remove `package-lock.json`; run `bun install` to generate and commit
  `bun.lock` in its place.
- `readme.md`: Getting Started and testing sections — `npm install` → `bun
install`; `npm run build` → `bun run build`; `npm link` → `bun link`; `npm
test` → `bun test`; `npm run test:watch` → `bun run test:watch`; `npm run
release v1.2.3` → `bun run release v1.2.3`.
- `scripts/check-submodule-status.sh`: update the echoed hint text from
  `npm run update:projects` to `bun run update:projects`.

## Error handling

No new error paths — these are like-for-like command/dependency swaps.
Existing error handling (`withErrorHandling`, `RequestHandler`/`runCommand`'s
existing rejection-on-nonzero-exit behavior) is unchanged.

## Testing

No new test coverage is needed — this change swaps shell-out commands,
removes a dead type/dependency, and updates docs/lockfile. Verification:

- `bun test src/__tests__` — full regression check, expect no change in
  pass count.
- `npx tsc -p tsconfig.json --noEmit` — must stay clean (removing the
  esbuild import must not introduce new type errors).
- Manual dry run where practical: `bbs functions init` in a scratch
  directory (confirms `bun install` runs instead of `npm i`); the `gen
types` "no package.json" prompt path is harder to dry-run end-to-end
  (requires a real GraphQL endpoint + auth) — reviewed by reading the diff
  carefully instead of a full live run.
