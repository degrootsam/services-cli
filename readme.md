# Betty Blocks - Services CLI (Proof of Concept)

- [Jest](https://jestjs.io/docs/getting-started)
- [Babel](https://babeljs.io/docs/usage)
- [Commander.js](https://github.com/tj/commander.js)
- [Inquirer](https://github.com/SBoudrias/Inquirer.js)
- [Ora](https://github.com/sindresorhus/ora)
- [Chalk](https://github.com/chalk/chalk)
- [FusionAuth](https://fusionauth.io/docs/sdks/typescript)
- [CodeGen for GraphQL Schema](https://the-guild.dev/graphql/codegen/plugins/typescript/typescript)
- [Keytar](https://github.com/atom/node-keytar)
- [Degit](https://github.com/Rich-Harris/degit)
- [Execa](https://github.com/sindresorhus/execa)
- [jtd: JSON Validation for JavaScript](https://github.com/jsontypedef/json-typedef-js)

# 🛠 BBS CLI Maintainers Guide

Welcome, maintainer! This guide provides everything you need to know to build, test, version, and release the BBS CLI.

---

## 📦 Project Overview

- **Name:** `bbs-cli`
- **Description:** A CLI for the Betty Blocks Platform
- **Author:** Sam de Groot
- **Language:** TypeScript (compiled to CommonJS)

---

## 📁 Structure

- `src/` – Source files
- `dist/` – Compiled CLI output (entry: `dist/index.js`)
- `scripts/` – Custom automation scripts
- `tests/` – Unit tests (run with Jest)

---

## 🚀 Getting Started

### Install dependencies:

```bash
npm install
```

### Build the CLI:

```bash
npm run build
```

> This compiles TypeScript and adds execute permissions to `dist/index.js`

### Run the CLI:

```bash
./dist/index.js
# or globally
npx bbs
```

---

## 🧪 Testing

Run all unit tests:

```bash
npm test
```

Jest is used alongside `ts-jest` for testing TypeScript.

---

## 🔄 Syncing the Repo

To pull the latest changes and auto-commit any unstaged work:

```bash
npm run sync
```

---

## 📦 Dev Dependencies Overview

| Tool                                       | Purpose                            |
| ------------------------------------------ | ---------------------------------- |
| `typescript`                               | Main compiler for CLI source       |
| `jest` / `ts-jest`                         | Testing suite                      |
| `commitizen` + `cz-conventional-changelog` | Standardizes commit messages       |
| `ts-node`                                  | Run TypeScript scripts directly    |
| `@types/*`                                 | Type support for Node and packages |

---

## 🚢 Releasing a New Version

> **TODO**: [ ] Add `npm run release` script

1. Bump the version in `package.json`
2. Build the CLI:

```bash
npm run build
```

3. Tag and push the release:

```bash
git tag vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

Once the `release` script is in place, this process will be automated.

---

## ✅ TODO

- [ ] Create a `npm run release` script to tag and push versions
- [x] Configure Trunk actions to manage and validate Git submodules
- [ ] Document supported CLI commands
- [ ] Add CLI usage examples to README

---

## 📄 License

This project is licensed under the MIT License.
