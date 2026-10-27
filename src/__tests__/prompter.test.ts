import { mock, describe, it, expect, beforeEach } from "bun:test";
import * as inquirer from "@inquirer/prompts";
import { createLogger } from "../utils/logger/index.js";
import { createPrompter } from "../utils/prompter/index.js";

// @inquirer/prompts is mocked via setup.ts preload — cast to access mock methods
const mockedInput = inquirer.input as ReturnType<typeof mock>;
const mockedPassword = inquirer.password as ReturnType<typeof mock>;
const mockedSelect = inquirer.select as ReturnType<typeof mock>;

describe("createPrompter", () => {
  it("returns an object with prompt methods", () => {
    const logger = createLogger({ verbose: false });
    const prompter = createPrompter({ logger });
    expect(typeof prompter.input).toBe("function");
    expect(typeof prompter.confirm).toBe("function");
    expect(typeof prompter.select).toBe("function");
  });
});

describe("Prompter", () => {
  const logger = createLogger({ verbose: false });
  const prompter = createPrompter({ logger });
  beforeEach(() => {
    mockedInput.mockClear();
    mockedPassword.mockClear();
    mockedSelect.mockClear();
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

describe("Prompter without input", () => {
  const logger = createLogger({ verbose: false });
  const prompter = createPrompter({ logger, interactive: false });
  beforeEach(() => {
    mockedInput.mockClear();
    mockedSelect.mockClear();
  });

  it("fails instead of asking a question", async () => {
    await expect(prompter.input("Please enter your app UUID")).rejects.toThrow(
      'Cannot ask "Please enter your app UUID"',
    );
    await expect(prompter.getPassword()).rejects.toThrow("--no-input");
    expect(mockedInput).not.toHaveBeenCalled();
  });

  it("uses the default for confirm and select", async () => {
    expect(await prompter.confirm("Create tests?", false)).toBe(false);
    expect(
      await prompter.select([{ name: "A", value: "a" }], "Pick", "a"),
    ).toBe("a");
    expect(mockedSelect).not.toHaveBeenCalled();
  });

  it("fails for a select without a default", async () => {
    await expect(
      prompter.select([{ name: "A", value: "a" }], "Pick one"),
    ).rejects.toThrow('Cannot ask "Pick one"');
  });
});
