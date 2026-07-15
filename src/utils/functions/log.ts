import { parseName } from ".";
import { AppDeps } from "../types";
import { Functions } from "./types";

export function logUploadedFunction({
  deps,
  functionResult,
}: {
  deps: AppDeps;
  functionResult: {
    status: string;
    name: string;
    error?: string;
    version?: string;
  };
}): void {
  const { status, name, error, version } = functionResult;
  const valid = status === "ok";
  const prefix = deps.logger.getValidationPrefix(valid);
  const color = deps.logger.getValidationColor(valid);
  const info = valid ? "successfully published" : error;
  const message = color(` - ${prefix} ${name}/${version}`) + `: ${info}`;
  console.log(message);
}

export function logValidatedFunctions({
  deps,
  functions,
}: {
  deps: AppDeps;
  functions: Functions;
}): void {
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const parsedName = parseName({ name });
    const {
      latestVersion,
      validation: { valid, info },
    } = currentFunction;
    const prefix = deps.logger.getValidationPrefix(valid);
    const color = deps.logger.getValidationColor(valid);
    const message = color(` - ${prefix} ${name}/${latestVersion}`);
    if (valid) {
      console.log(message);
    } else {
      const { isAsync, isDefaultExport } = info;
      console.log(`${message}: `);
      if (!isDefaultExport) {
        console.log(
          color(
            `\t- Your function name should be '${parsedName}' and it should be defined as a default export!`,
          ),
        );
      }
      if (!isAsync) {
        console.log(color("\t- Your function should return a Promise!"));
      }
    }
  });
}
