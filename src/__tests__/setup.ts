import { mock } from "bun:test";
import { mockedKeytar } from "../__mocks__/keytar/index.js";

mock.module("@inquirer/prompts", () => ({
  input: mock(),
  password: mock(),
  select: mock(),
  confirm: mock(),
  editor: mock(),
}));

// Tests never touch the real Keychain
mock.module("keytar", () => ({ default: mockedKeytar }));
