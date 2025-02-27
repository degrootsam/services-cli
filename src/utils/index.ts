import ora from "ora";
import CONFIG from "./config";
import Director from "./director";
import FunctionsUtils from "./functions";
import GraphQLAPI from "./gql-api";
import { clearToken, getToken, saveToken } from "./keychain";
import Logger from "./logger/index";
import Prompter from "./prompter";
import ComponentsScaffolder from "./scaffolder/components";
import FunctionsScaffolder from "./scaffolder/functions";

const opts = process.argv.find((v) => v === "--v" || v === "--verbose");
const logger = new Logger(opts && opts.length > 0);
const prompter = new Prompter();
const director = new Director();
const spinner = ora();

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

export {
  clearToken,
  ComponentsScaffolder,
  CONFIG,
  director,
  FunctionsScaffolder,
  FunctionsUtils,
  getToken,
  GraphQLAPI,
  isErrorWithCode,
  isErrorWithMessage,
  logger,
  prompter,
  saveToken,
  spinner,
};
