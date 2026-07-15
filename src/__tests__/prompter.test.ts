import { mock, describe, it, expect, beforeEach } from "bun:test";
import * as inquirer from "@inquirer/prompts";
import { createLogger } from "../utils/logger";
import { createPrompter } from "../utils/prompter";
import { prompter } from "../utils/index";

// @inquirer/prompts is mocked via setup.ts preload — cast to access mock methods
const mockedInput = inquirer.input as ReturnType<typeof mock>;
const mockedPassword = inquirer.password as ReturnType<typeof mock>;
const mockedSelect = inquirer.select as ReturnType<typeof mock>;

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
