// __tests__/prompter.test.ts
//
// vi.mock is hoisted by vitest before imports execute, so static imports of
// @inquirer/prompts (and anything that loads it) receive the mocked version.

vi.mock("@inquirer/prompts", () => ({
  input: vi.fn(),
  password: vi.fn(),
  select: vi.fn(),
  confirm: vi.fn(),
  editor: vi.fn(),
}));

import * as inquirer from "@inquirer/prompts";
import { createLogger } from "../src/utils/logger";
import { createPrompter } from "../src/utils/prompter";
import { prompter } from "../src/utils/index";

const mockedInput = vi.mocked(inquirer.input);
const mockedPassword = vi.mocked(inquirer.password);
const mockedSelect = vi.mocked(inquirer.select);

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
    vi.clearAllMocks();
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
