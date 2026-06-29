import type {
  input,
  password,
  select,
  confirm,
  editor,
} from "@inquirer/prompts";
import type { MockedFunction } from "vitest";

export const mockedInput = vi.fn() as MockedFunction<typeof input>;
export const mockedPassword = vi.fn() as MockedFunction<typeof password>;
export const mockedSelect = vi.fn() as MockedFunction<typeof select>;
export const mockedConfirm = vi.fn() as MockedFunction<typeof confirm>;
export const mockedEditor = vi.fn() as MockedFunction<typeof editor>;
