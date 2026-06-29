import { confirm, editor } from "@inquirer/prompts";
import { jest } from "@jest/globals";
import { autoMock } from "../utils";
const { input, password, select } = await import("@inquirer/prompts");

const inquirer = await import("@inquirer/prompts");

jest.unstable_mockModule("@inquirer/prompts", () => inquirer);

const mockedInput = input as jest.MockedFunction<typeof input>;
const mockedPassword = password as jest.MockedFunction<typeof password>;
const mockedSelect = select as jest.MockedFunction<typeof select>;

export { mockedInput, mockedPassword, mockedSelect };
