// __tests__/prompter.test.ts
//
// ESM mock setup must happen before any module that transitively imports
// @inquirer/prompts is loaded. We:
//   1. Statically import only @jest/globals and our mock-function helpers
//      (neither pulls in @inquirer/prompts at runtime).
//   2. Call jest.unstable_mockModule in the module body (runs before any
//      top-level await).
//   3. Dynamically import everything else so Node.js ESM uses the registered
//      mock when it resolves @inquirer/prompts.

import { jest } from "@jest/globals";
import {
  mockedInput,
  mockedPassword,
  mockedSelect,
  mockedConfirm,
  mockedEditor,
} from "../__mocks__/prompter";

jest.unstable_mockModule("@inquirer/prompts", () => ({
  input: mockedInput,
  password: mockedPassword,
  select: mockedSelect,
  confirm: mockedConfirm,
  editor: mockedEditor,
}));

const { createLogger } = await import("../src/utils/logger");
const { createPrompter } = await import("../src/utils/prompter");
const { prompter } = await import("../src/utils/index");

describe("createPrompter", () => {
  it("returns an object with prompt methods", () => {
    const logger = createLogger({ verbose: false });
    const p = createPrompter(logger);
    expect(typeof p.input).toBe("function");
    expect(typeof p.confirm).toBe("function");
    expect(typeof p.select).toBe("function");
  });
});

describe("Prompter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the provided username", async () => {
    mockedInput.mockResolvedValue("Alice");

    const username = await prompter.getUsername();
    expect(username).toBe("Alice");
    expect(mockedInput).toHaveBeenCalledTimes(1);
  });

  it("should return the provided password", async () => {
    mockedPassword.mockResolvedValue("supersecret");

    const userPassword = await prompter.getPassword();
    expect(userPassword).toBe("supersecret");
    expect(mockedPassword).toHaveBeenCalledTimes(1);
  });

  it("should return the provided URL", async () => {
    mockedInput.mockResolvedValue("https://example.com");

    const url = await prompter.getURL("Enter a URL:");
    expect(url).toBe("https://example.com");
    expect(mockedInput).toHaveBeenCalledTimes(1);
  });

  it("should return the selected answer", async () => {
    mockedSelect.mockResolvedValue("a");

    const options = [
      { name: "A", value: "a" },
      { name: "B", value: "b" },
    ];
    const answer = await prompter.select(options);
    expect(answer).toBe("a");
    expect(mockedSelect).toHaveBeenCalledTimes(1);
  });
});
