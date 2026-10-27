# BBS CLI

A TypeScript command-line tool (`bbs`) for building, validating and publishing Betty Blocks functions and components. Built on Commander, `@inquirer/prompts` and Keytar; Bun runs it, bundles functions (`Bun.build`) and runs the tests. User-facing docs live in [readme.md](readme.md). Scaffolding templates live in the `codegen-templates/` git submodule.

## Commands

| Command                                     | Does                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| `npx tsc -p tsconfig.json --noEmit`         | Typecheck (`src/__tests__` and `src/__mocks__` are excluded)             |
| `bun test src/__tests__`                    | Unit tests (`bun run test`; the preload mocks `@inquirer/prompts`)       |
| `bun run build` then `bun link`             | Compile to `dist/`, then expose `bbs` globally to try a command for real |
| `bun run lint` / `bun run fmt`              | Trunk checks (prettier, markdownlint, trufflehog, ...) / format          |
| `bun run setup` / `bun run update:projects` | Init / update the `codegen-templates` submodule                          |
| `bun run gen:function-schema`               | Regenerate the function JSON schema types                                |

Use Bun, not npm or Vitest: `bunfig.toml` preloads `src/__tests__/setup.ts`, which replaces every `@inquirer/prompts` function with a mock. A test that reaches a real prompt hangs.

Commands that log in (`bbs login`, `functions publish`, `functions gen types`) talk to a live Betty Blocks environment and write to the macOS Keychain. Do not run them yourself; ask the owner to, or test the logic through mocked `deps`. `bbs functions publish --dry-run --no-input` is safe: it validates, builds and zips without logging in.

## Work order

Follow these steps, in order, for any change of size. Skip one only when the change is trivial, and say which.

1. **Look before proposing.** Read the code the change touches (grep for callers, `AppDeps` users, shared state). Never design from memory.
2. **Discuss when the choice is the owner's.** Command names, flags, prompts, defaults, config shape (`bbs.config.ts`, `.bbs/state.json`) and breaking changes go to the owner as a question with 2-4 options, the recommended one first, each with its trade-off. Decide everything else with a sensible default and say so. Once the owner says "start", do not ask whether to proceed.
3. **Spec, then plan, both local.** `docs/superpowers/specs/<date>-<topic>-design.md` (goal, decisions and who made them, design, out of scope, risks), then `docs/superpowers/plans/<date>-<topic>-plan.md` (global constraints, task order, tasks as checkboxes, tests first, one commit per task, review focus). That folder is git-ignored and never committed. For a big change the owner approves the spec before the plan.
4. **Branch from an up-to-date `master`.** Names: `feat/…`, `fix/…`, `refactor/…`, `chore/…`, `docs/…`. Stack on an open PR only when the change needs that PR's code, and say so in the PR body (base branch, retarget note).
5. **Interfaces first, then parallel work.** Do the task that defines the shared interface (a new `PrompterAPI` method, an `AppDeps` field, a type in `types/`) first and commit it. Then give disjoint areas to parallel helpers (sub-agents). Each gets: the plan task, the exact signatures it must honour, the files it owns, the files it must not touch, "edit files only, no git commands that change state, run prettier only on files you edited", "tests first", and the exact reply format.
6. **Verify yourself, never trust a helper's report alone.** Run, in this order: typecheck, `bun test src/__tests__`, `bun run build`, `bun run lint`. Check the line count of every file you grew (`wc -l`). Investigate a red test alone before calling it flaky: a hang usually means an unmocked prompt or a real Keychain or network call.
7. **Commit per task, with explicit paths.** More than one session may share this working tree: look at `git status` and `git reflog` first, stage named paths (not `git add -A` at the root), and leave changes you did not make alone (mention them). Conventional prefix (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`), `!` for a breaking change; commitlint checks it. The Trunk pre-commit hook formats staged files and checks the submodule state: commit what it formats.
8. **Docs and version belong to the change.** A user-facing change (a command, flag, prompt or config key) updates the matching section of `readme.md`. Bump `package.json` only if the owner's flow does (`bun run release` makes the tag), because another session may bump it too.
9. **Push and open the PR against the right base.** Body: Summary (what and why), Breaking change (when there is one, with the escape hatch), Test plan as checkboxes with real counts. Pushing a branch and opening a PR is part of "commit and open a PR". Anything outward-facing beyond that (a release tag, a publish) needs an explicit yes.
10. **Report.** There is no CI, so the local checks are the gate. The final report says: what changed, check results with numbers, what is untested or open (honestly, including anything that needs a live environment), the merge order when PRs are stacked, and what the owner has to do elsewhere (for example in `codegen-templates`, a separate repository).

## Size and modularity

- **A file does one job.** Past about 400 lines, or a function past about 60, look for the seam and split before adding more. `src/utils/gql-api/index.ts` is already at that limit: new login methods or request helpers go into modules next to it.
- **Commands stay thin.** A file under `src/commands/` parses arguments and calls into `src/utils/`; the work lives in a util. Wrap every action in `withErrorHandling` so state is saved and errors are logged the same way.
- **Dependencies come in through `deps`.** Utils are factories (`createX({ deps })`) that take `AppDeps` (`logger`, `director`, `prompter`, `config`, `state`, `spinner`) instead of importing singletons. Only `src/utils/index.ts` builds the real `deps`. This is what lets tests pass mocks (`autoMock` in `src/__mocks__/utils.ts`).
- **One way to do each side effect.** Prompts go through `prompter` (never import `@inquirer/prompts` elsewhere), files and processes through `director`, secrets through `keychain`, output through `logger`. Need something new? Add a method to that API, not a direct call.
- **Move first, rewrite never.** A split moves code unchanged into the new file (tests move with it), then small cleanups go into a separate commit. Exports from `dist/config.js` (`createConfig` and its types) are public API for users' `bbs.config.ts`: keep them stable.
- **One copy of everything.** Before adding a helper, grep for an existing one. Types shared by two folders live in a shared module (`src/utils/types.ts` or a `types/` folder), not in either folder.
- **Comments and names match the surrounding code.** No stale comments (a comment that describes removed behaviour is a bug), no `export` for something used only in its own file.

## Facts that are easy to get wrong

- ES modules with `moduleResolution: Node16`: relative imports need the `.js` extension, even from `.ts` files.
- `src/utils/index.ts` reads `-v` / `-f` straight from `process.argv` and uses top-level `await` to build `deps`, so importing it runs config bootstrapping. Tests should build their own mocked `deps`, not import it.
- Tests: `keytar` is replaced by an in-memory store in the preload (`src/__mocks__/keytar`), so tests never touch the Keychain. `mock.module` is process-wide and patches live bindings: copy the real exports before mocking (`const real = { ...realModule }`) and put them back in `afterAll`, or other test files get the mock.
- Cancelling a prompt throws `User force closed the prompt with 0 null`; `withErrorHandling` swallows that message on purpose.
- `bbs.config.ts` always wins over the legacy `config.json`, which is read but never written. `.bbs/state.json` is CLI-owned bookkeeping.
- `codegen-templates/` is a submodule and git-ignored here: changes to the templates go to that repository.
- `docs/superpowers/` is local only. Do not link to it from the repository.
