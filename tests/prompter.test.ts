import { input, password, select } from "@inquirer/prompts";
import { prompter } from "../src/utils";

jest.mock("@inquirer/prompts", () => ({
  input: jest.fn(),
  password: jest.fn(),
  select: jest.fn(),
}));

describe("Prompter", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clears previous mock calls
  });

  it("should return the provided username", async () => {
    (input as jest.Mock).mockResolvedValue("Alice");

    const username = await prompter.getUsername();

    expect(username).toBe("Alice");
    expect(input).toHaveBeenCalledTimes(1);
  });

  it("should return the provided password", async () => {
    (password as jest.Mock).mockResolvedValue("supersecret");

    const userPassword = await prompter.getPassword();

    expect(userPassword).toBe("supersecret");
    expect(password).toHaveBeenCalledTimes(1);
  });

  it("should return the provided URL", async () => {
    (input as jest.Mock).mockResolvedValue("https://example.com");

    const url = await prompter.getURL("Enter a URL:");

    expect(url).toBe("https://example.com");
    expect(input).toHaveBeenCalledTimes(1);
  });

  it("should return the selected answer", async () => {
    (select as jest.Mock).mockResolvedValue("a");
    const options = [
      { name: "A", value: "a" },
      { name: "B", value: "b" },
    ];
    const answer = await prompter.select(options);

    expect(answer).toBe("a");
    expect(select).toHaveBeenCalledTimes(1);
  });
});
