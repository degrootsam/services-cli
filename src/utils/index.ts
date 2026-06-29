import { createSpinner } from "nanospinner";
import { ConfigManager } from "./config";
import { createDirector } from "./director";
import FunctionsUtils from "./functions";
import GraphQLAPI from "./gql-api";
import { clearToken, getToken, saveToken } from "./keychain";
import { createLogger } from "./logger/index";
import Prompter from "./prompter";
import ComponentsScaffolder from "./scaffolder/components";
import FunctionsScaffolder from "./scaffolder/functions";
import Git from "./git";
import CodeParser from "./code-parser";

const opts = process.argv;
const verboseArg = opts.find((v) => v === "-v" || v === "--verbose");
const forceArg = opts.find((v) => v === "-f" || v === "--force");
const logger = createLogger({
  verbose: !!(verboseArg && verboseArg.length > 0),
});
const prompter = new Prompter();
const director = createDirector(logger);
const spinner = createSpinner();
const config = new ConfigManager({ force: forceArg && forceArg.length > 0 });

// Wrapper function to catch errors
function withErrorHandling(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
      config.saveConfig();
    } catch (error) {
      logger.debug(error);
      if (isErrorWithMessage(error)) {
        // Prevent logging when user cancels the action
        if (error.message !== "User force closed the prompt with 0 null") {
          if (spinner.isSpinning()) {
            spinner.error(error.message);
          } else {
            logger.error(error.message);
          }
        }
      } else {
        if (spinner.isSpinning()) {
          spinner.error("Failed with an error");
        }
        logger.error(error);
      }
    }
    process.exit(1);
  };
}

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
  CodeParser,
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
  withErrorHandling,
};
