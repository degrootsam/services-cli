import { getFunctionFilePath, parseName } from ".";
import { createCodeParser } from "../code-parser";
import { AppDeps } from "../types";
import { logValidatedFunctions } from "./log";
import { Functions } from "./types";

export async function validateFunctions({
  deps,
  functions,
  type = "ts",
}: {
  deps: AppDeps;
  functions: Functions;
  type?: "js" | "ts";
}): Promise<Functions> {
  deps.logger.debug(
    `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
  );
  const functionNames = Object.keys(functions);
  let validatedFunctions: Functions = {};

  deps.spinner.start("Validating functions...");
  const parser = createCodeParser({ type, logger: deps.logger });

  for (const currentFunctionName of functionNames) {
    const currentFunction = functions[currentFunctionName];
    const functionContent = await deps.director.readFile(
      getFunctionFilePath({ func: currentFunction }),
    );

    if (!functionContent) {
      validatedFunctions[currentFunctionName] = {
        ...currentFunction,
        validation: { ...currentFunction.validation, valid: false },
      };
      continue;
    }

    const validatedFunction = parser.validateFunction(
      functionContent,
      currentFunction,
      parseName({ name: currentFunctionName }),
    );
    validatedFunctions[currentFunctionName] = validatedFunction;
  }

  deps.spinner.success("Functions validated:");
  logValidatedFunctions({ deps, functions: validatedFunctions });

  return validatedFunctions;
}

export function getValidFunctions({
  functions,
}: {
  functions: Functions;
}): Functions {
  const funcNames = Object.keys(functions);
  const validFunctions: Functions = {};

  for (let i = 0; i < funcNames.length; i++) {
    const name = funcNames[i];
    const func = functions[name];
    if (func?.validation.valid) {
      validFunctions[funcNames[i]] = func;
    }
  }

  return validFunctions;
}
