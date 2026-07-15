import { mock } from "bun:test";
import type {
  input,
  password,
  select,
  confirm,
  editor,
} from "@inquirer/prompts";

export const mockedInput = mock<typeof input>();
export const mockedPassword = mock<typeof password>();
export const mockedSelect = mock<typeof select>();
export const mockedConfirm = mock<typeof confirm>();
export const mockedEditor = mock<typeof editor>();
