# BBS CLI — Betty Blocks Services CLI

A command-line tool for developing, building, and publishing Betty Blocks functions and components.

## Tech Stack

| Tool                                                                                               | Purpose                  |
| -------------------------------------------------------------------------------------------------- | ------------------------ |
| [Commander.js](https://github.com/tj/commander.js)                                                 | CLI framework            |
| [@inquirer/prompts](https://github.com/SBoudrias/Inquirer.js)                                      | Interactive prompts      |
| [nanospinner](https://github.com/usmanyunusov/nanospinner)                                         | Spinner                  |
| [Chalk](https://github.com/chalk/chalk)                                                            | Terminal colors          |
| [esbuild](https://esbuild.github.io/)                                                              | Function bundler         |
| [@graphql-codegen/typescript](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript) | GraphQL type generation  |
| [Keytar](https://github.com/atom/node-keytar)                                                      | Credential storage       |
| [Degit](https://github.com/Rich-Harris/degit)                                                      | Template cloning         |
| [jtd](https://github.com/jsontypedef/json-typedef-js)                                              | JSON Schema validation   |
| [Vitest](https://vitest.dev/)                                                                      | Test runner              |
| TypeScript → CommonJS                                                                              | Language / output format |

---

## Getting Started

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
npm link  # exposes 'bbs' globally via symlink
```

### Run

```bash
./dist/index.js
# or after npm link:
bbs
```

---

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
```

`bbs functions init` and `bbs components init` scaffold a starter `bbs.config.ts` for you.

`bbs.config.ts` is optional and always wins over any other config source. If your project
has a legacy `config.json` (from an earlier version of this CLI), its values are still read
as a fallback — but it is never written to again. The CLI's own bookkeeping (resolved app
identity, template version pins) lives in `.bbs/state.json`, which the CLI manages fully —
you shouldn't need to edit it.

---

## Commands

### `bbs login`

Authenticate with the Betty Blocks platform.

---

### `bbs update`

| Subcommand           | Description                         |
| -------------------- | ----------------------------------- |
| `bbs update check`   | Check for CLI and submodule updates |
| `bbs update install` | Pull and apply latest updates       |

---

### `bbs functions`

#### `bbs functions init <name>`

Scaffold a new functions project, install dependencies.

| Flag                 | Description                                         |
| -------------------- | --------------------------------------------------- |
| `--javascript`, `-j` | Scaffold a JavaScript project instead of TypeScript |
| `--force`, `-f`      | Overwrite if project already exists                 |

#### `bbs functions new <name>`

Add a new function to an existing project.

| Flag            | Description                          |
| --------------- | ------------------------------------ |
| `--force`, `-f` | Overwrite if function already exists |

#### `bbs functions build`

Compile and bundle all functions via esbuild.

| Flag                         | Description                              |
| ---------------------------- | ---------------------------------------- |
| `--destination <path>`, `-d` | Custom output path                       |
| `--debug`                    | Output non-minified bundle for debugging |

#### `bbs functions validate`

Validate all functions against the Betty Blocks JSON schema.

#### `bbs functions publish`

Validate, build, zip, and upload functions to the platform.

#### `bbs functions bump`

Create a new version for a function (interactive).

#### `bbs functions gen types`

Generate a TypeScript types file from the Betty Blocks application's GraphQL schema.

Prompts for project setup if no `package.json` is found in the current directory.

#### `bbs functions gen test`

Generate test scaffolding for a selected function.

| Flag            | Description                  |
| --------------- | ---------------------------- |
| `--force`, `-f` | Overwrite existing test file |

---

### `bbs components`

#### `bbs components init <name>`

Scaffold a new components project.

| Flag            | Description                         |
| --------------- | ----------------------------------- |
| `--force`, `-f` | Overwrite if project already exists |

#### `bbs components new <name>`

Add a new component to an existing project.

---

## Testing

```bash
npm test          # run once
npm run test:watch  # watch mode
```

Tests live in `__tests__/`. Powered by Vitest with `globals: true` (no imports needed for `describe`, `it`, `expect`, `vi`).

---

## Project Structure

```
src/
  commands/         # CLI command definitions
    functions/      # bbs functions *
    components/     # bbs components *
    update/         # bbs update *
  utils/
    code-parser/    # AST parsing via @babel/parser + @babel/traverse
    config/         # Config loading and merging
    director/       # Filesystem, process, and zip utilities
    functions/      # Function discovery and build orchestration
    fusion-auth/    # Authentication
    git/            # Git helpers
    gql-api/        # GraphQL API client
    json-schema/    # Schema validation
    keychain/       # Credential storage
    logger/         # Winston logger wrapper
    prompter/       # @inquirer/prompts wrapper
    scaffolder/     # Project and function scaffolding
    update/         # CLI self-update logic
__tests__/          # Vitest test suites
codegen-templates/  # Git submodule — scaffolding templates
scripts/            # Automation scripts
```

---

## Releasing

```bash
npm run release v1.2.3
```

Creates and pushes a `v1.2.3` git tag. The version argument must be a valid semver string.

---

## License

MIT
