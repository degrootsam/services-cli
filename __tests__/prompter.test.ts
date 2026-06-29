// __tests__/prompter.test.ts

import { jest } from "@jest/globals";
import { createPrompter } from "../src/utils/prompter";
import { createLogger } from "../src/utils/logger";
import {
  mockedInput,
  mockedPassword,
  mockedSelect,
} from "../__mocks__/prompter";

// Note: use dynamic (await import) so the mocks are picked up.
const { prompter } = await import("../src/utils/index");

describe("createPrompter", () => {
  it("returns an object with prompt methods", () => {
    const logger = createLogger({ verbose: false });
    const prompter = createPrompter(logger);
    expect(typeof prompter.input).toBe("function");
    expect(typeof prompter.confirm).toBe("function");
    expect(typeof prompter.select).toBe("function");
  });
});

describe("Prompter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return the provided username", async () => {
    // Now, when Prompter.getUsername calls input, it hits the mocked version.

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
