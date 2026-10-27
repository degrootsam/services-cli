import { createSpinner } from "nanospinner";
import { bootstrapConfig } from "./config/index.js";
import { createDirector } from "./director/index.js";
import { isErrorWithMessage } from "./errors.js";
import { createLogger } from "./logger/index.js";
import { createPrompter } from "./prompter/index.js";
import { createState } from "./state/index.js";
import type { AppDeps } from "./types.js";

const opts = process.argv;
const verboseArg = opts.find((v) => v === "-v" || v === "--verbose");
const forceArg = opts.find((v) => v === "-f" || v === "--force");
const logger = createLogger({
  verbose: !!(verboseArg && verboseArg.length > 0),
});
const prompter = createPrompter({ logger });
const director = createDirector({ logger });
const spinner = createSpinner();
const state = await createState({ deps: { director, logger } });
const config = await bootstrapConfig({
  opts: { force: !!(forceArg && forceArg.length > 0) },
  deps: { director, logger, prompter, state },
});

const deps: AppDeps = { logger, director, prompter, config, state, spinner };

export { deps };

// Wrapper function to catch errors
export function withErrorHandling(fn: (...args: any[]) => Promise<void>) {
  return async (...args: any[]) => {
    try {
      await fn(...args);
      await state.saveState();
      process.exit(0);
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
      process.exit(1);
    }
  };
}

export { deepMerge } from "./deep-merge.js";
export { isErrorWithCode, isErrorWithMessage } from "./errors.js";
export type { AppDeps, SpinnerAPI } from "./types.js";
