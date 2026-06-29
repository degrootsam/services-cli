import chalk from "chalk";
import { Functions, FunctionResult } from "../functions/types";

export const DEBUG_PREFIX = chalk.bgWhite(chalk.black("DEBUG:"));
export const ERROR_PREFIX = chalk.bgRed(chalk.black("ERROR:"));

export type LoggerAPI = {
  debug: (...message: any[]) => void;
  error: (...message: any[]) => void;
  info: (...message: any[]) => void;
  warn: (...message: any[]) => void;
  toggleVerbose: (verbose: boolean) => void;
  getValidationPrefix: (state: boolean) => string;
  getValidationColor: (state: boolean) => typeof chalk.greenBright;
};

export function createLogger({
  verbose = false,
}: { verbose?: boolean } = {}): LoggerAPI {
  let _verbose = verbose;

  const errorColor = chalk.redBright;
  const successColor = chalk.greenBright;
  const warningColor = chalk.yellowBright;

  return {
    toggleVerbose(v) {
      _verbose = v;
    },
    debug(...message) {
      if (_verbose) console.debug(DEBUG_PREFIX, ...message);
    },
    error(...message) {
      console.error(ERROR_PREFIX, ...message);
    },
    info(...message) {
      console.info(...message);
    },
    warn(...message) {
      console.log(warningColor("⚠", message));
    },
    getValidationPrefix(state) {
      return state ? "√" : "x";
    },
    getValidationColor(state) {
      return state ? successColor : errorColor;
    },
  };
}
