import chalk from "chalk";
import { FunctionsUtils } from "..";
import { Functions, FunctionResult } from "../functions/types";

export const DEBUG_PREFIX = chalk.bgWhite(chalk.black("DEBUG:"));
export const ERROR_PREFIX = chalk.bgRed(chalk.black("ERROR:"));

export default class Logger {
  private verbose: boolean = false;

  public successPrefix = "√";
  public errorPrefix = "x";
  public warningPrefix = "⚠";
  public errorColor = chalk.redBright;
  public successColor = chalk.greenBright;
  public warningColor = chalk.yellowBright;

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
    console.info(...message);
  }

  getValidationPrefix(state: boolean): string {
    return state ? this.successPrefix : this.errorPrefix;
  }

  getValidationColor(state: boolean) {
    return state ? this.successColor : this.errorColor;
  }

  success(...message: any) {
    const color = this.getValidationColor(true);
    const prefix = this.getValidationPrefix(true);

    console.log(color(`${prefix} ${message}`));
  }

  warn(...message: any) {
    const color = this.warningColor;
    const prefix = this.warningPrefix;

    console.log(color(prefix, message));
  }

  validatedFunctions(functions: Functions) {
    const functionsUtils = new FunctionsUtils();
    const functionNames = Object.keys(functions);
    functionNames.forEach((name) => {
      const currentFunction = functions[name];
      const parsedName = functionsUtils.parseName(name);
      const {
        latestVersion,
        validation: { valid, info },
      } = currentFunction;
      const prefix = this.getValidationPrefix(valid);
      const color = this.getValidationColor(valid);
      const message = color(` - ${prefix} ${name}/${latestVersion}`);
      if (valid) {
        console.log(message);
      } else {
        const { isAsync, isDefaultExport } = info;
        console.log(`${message}: `);
        !isDefaultExport &&
          console.log(
            color(
              `\t- Your function name should be '${parsedName}' and it should be defined as a default export!`,
            ),
          );
        !isAsync &&
          console.log(color("\t- Your function should return a Promise!"));
      }
    });
  }

  uploadedFunction(functionResult: FunctionResult) {
    const { status, name, error, version } = functionResult;
    const valid = status === "ok";
    const prefix = this.getValidationPrefix(valid);
    const color = this.getValidationColor(valid);
    const info = valid ? "successfully published" : error;
    const message = color(` - ${prefix} ${name}/${version}`) + `: ${info}`;
    console.log(message);
  }
}
