import { createSpinner } from "nanospinner";
import { bootstrapConfig } from "./config";
import { createState } from "./state";
import { createDirector } from "./director";
import {
  buildFunctions,
  getFunctions,
  validateFunctions,
  parseName,
  uploadFunctions,
  getFunctionsJSON,
  getValidFunctions,
  logValidatedFunctions,
  logUploadedFunction,
  generateFunctionsBarrelFile,
  generateBarrelImportDeclarations,
  generateBarrelFunctionDeclaration,
  getFunctionFilePath,
  getFunctionJsonFilePath,
  getBuildPath,
  functionIsExportedAsDefault,
} from "./functions";
import { createGraphQLAPI } from "./gql-api";
import { clearToken, getToken, saveToken } from "./keychain";
import { createLogger } from "./logger/index";
import { createPrompter } from "./prompter";
import {
  generateProject as generateFunctionsProject,
  generateFunction,
  generateCodeGenFile,
  generateFunctionsBarrelFile as generateFunctionsBarrel,
  generateTest,
  bumpFunction,
} from "./scaffolder/functions";
import {
  generateProject as generateComponentsProject,
  generateComponent,
} from "./scaffolder/components";
import { downloadTemplate, copyTemplateFromLocal } from "./scaffolder";
import { createGit, compareVersions } from "./git";
import { createCodeParser } from "./code-parser";
import { isErrorWithMessage, isErrorWithCode } from "./errors";
import type { AppDeps } from "./types";

const opts = process.argv;
const verboseArg = opts.find((v) => v === "-v" || v === "--verbose");
const forceArg = opts.find((v) => v === "-f" || v === "--force");
const logger = createLogger({
  verbose: !!(verboseArg && verboseArg.length > 0),
});
const prompter = createPrompter({ logger });
const director = createDirector({ logger });
const spinner = createSpinner();
const state = createState({ deps: { director, logger } });
const config = await bootstrapConfig({
  opts: { force: !!(forceArg && forceArg.length > 0) },
  deps: { director, logger, prompter, state },
});

const deps: AppDeps = { logger, director, prompter, config, state, spinner };

// Wrapper function to catch errors
function withErrorHandling(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
      state.saveState();
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

export type { AppDeps, SpinnerAPI } from "./types";
export { isErrorWithMessage, isErrorWithCode } from "./errors";

export {
  buildFunctions,
  bumpFunction,
  copyTemplateFromLocal,
  createCodeParser,
  clearToken,
  config,
  deepMerge,
  deps,
  director,
  state,
  downloadTemplate,
  functionIsExportedAsDefault,
  generateBarrelFunctionDeclaration,
  generateBarrelImportDeclarations,
  generateCodeGenFile,
  generateComponent,
  generateComponentsProject,
  generateFunction,
  generateFunctionsBarrel,
  generateFunctionsBarrelFile,
  generateFunctionsProject,
  generateTest,
  getBuildPath,
  getFunctionFilePath,
  getFunctionJsonFilePath,
  getFunctions,
  getFunctionsJSON,
  getToken,
  getValidFunctions,
  createGraphQLAPI,
  createGit,
  compareVersions,
  logUploadedFunction,
  logValidatedFunctions,
  logger,
  parseName,
  prompter,
  saveToken,
  spinner,
  uploadFunctions,
  validateFunctions,
  withErrorHandling,
};
