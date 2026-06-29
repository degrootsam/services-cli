import { jest } from "@jest/globals";
import type {
  input,
  password,
  select,
  confirm,
  editor,
} from "@inquirer/prompts";

// Exported jest mock functions. The test file is responsible for registering
// these with jest.unstable_mockModule BEFORE importing any module that uses
// @inquirer/prompts, so that Node.js ESM loads the mocked version.
export const mockedInput = jest.fn() as jest.MockedFunction<typeof input>;
export const mockedPassword = jest.fn() as jest.MockedFunction<typeof password>;
export const mockedSelect = jest.fn() as jest.MockedFunction<typeof select>;
export const mockedConfirm = jest.fn() as jest.MockedFunction<typeof confirm>;
export const mockedEditor = jest.fn() as jest.MockedFunction<typeof editor>;
