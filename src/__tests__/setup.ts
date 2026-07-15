import { mock } from "bun:test";

mock.module("@inquirer/prompts", () => ({
  input: mock(),
  password: mock(),
  select: mock(),
  confirm: mock(),
  editor: mock(),
}));
