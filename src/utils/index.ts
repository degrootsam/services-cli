import { createSpinner } from "nanospinner";
import { ConfigManager } from "./config";
import Director from "./director";
import FunctionsUtils from "./functions";
import GraphQLAPI from "./gql-api";
import { clearToken, getToken, saveToken } from "./keychain";
import Logger from "./logger/index";
import Prompter from "./prompter";
import ComponentsScaffolder from "./scaffolder/components";
import FunctionsScaffolder from "./scaffolder/functions";
import Git from "./git";

const opts = process.argv.find((v) => v === "--v" || v === "--verbose");
const logger = new Logger(opts && opts.length > 0);
const prompter = new Prompter();
const director = new Director();
const spinner = createSpinner();
const config = new ConfigManager();

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

export {
  clearToken,
  ComponentsScaffolder,
  config,
  deepMerge,
  director,
  FunctionsScaffolder,
  FunctionsUtils,
  getToken,
  GraphQLAPI,
  Git,
  isErrorWithCode,
  isErrorWithMessage,
  logger,
  prompter,
  saveToken,
  spinner,
};
