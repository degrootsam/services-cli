import chalk from "chalk";
import { SOURCEPATH, spinner } from "..";
import { Functions } from "../types";

export const DEBUG_PREFIX = chalk.bgWhite(chalk.black("DEBUG:"));
export const ERROR_PREFIX = chalk.bgRed(chalk.black("ERROR:"));
export const INFO_PREFIX = chalk.bgWhite(chalk.black("INFO:"));

export default class Logger {
  private verbose: boolean = false;

  constructor(verbose?: boolean) {
    this.verbose = verbose ?? false;
  }

  toggleVerbose(verbose: boolean) {
    this.verbose = verbose;
  }

  debug(...message: any) {
    if (this.verbose) {
      console.debug(DEBUG_PREFIX, ...message);
    }
  }

  error(...message: any) {
    console.error(ERROR_PREFIX, ...message);
  }

  info(...message: any) {
    console.info(INFO_PREFIX, ...message);
  }

  functions(functions: Functions) {
    const functionNames = Object.keys(functions);
    functionNames.forEach((name) => {
      const currentFunction = functions[name];
      const {
        latestVersion,
        validation: { valid, info },
      } = currentFunction;
      const prefix = valid ? "✔ " : "❌";
      console.log(` - ${prefix} ${name}/${latestVersion}: ${info}`);
    });
  }
}
