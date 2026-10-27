import { getFunctionFilePath, parseName } from "./index.js";
import { createCodeParser } from "../code-parser/index.js";
import { AppDeps, ProjectTypeKey } from "../types.js";
import { logValidatedFunctions } from "./log.js";
import { FunctionInfo, Functions } from "./types.js";
import { getFunctionJSON } from "./get.js";

export async function validateFunctions({
  deps,
  functions,
  type,
  log = true,
}: {
  deps: AppDeps;
  functions: Functions;
  type: ProjectTypeKey;
  log?: boolean;
}): Promise<Functions> {
  deps.spinner.start("Validating functions...");
  let validatedFunctions: Functions = {};
  if (type === "wasm") {
    validatedFunctions = await validateWASMFunctions({ deps, functions });
  } else {
    validatedFunctions = await validateJSTSFunctions({ deps, functions, type });
  }
  if (log) {
    deps.spinner.success("Functions validated:");
    logValidatedFunctions({ deps, functions: validatedFunctions });
  } else {
    deps.spinner.stop();
  }
  return validatedFunctions;
}

export async function validateWASMFunctions({
  deps,
  functions,
}: {
  deps: AppDeps;
  functions: Functions;
}): Promise<Functions> {
  const functionNames = Object.keys(functions);
  let validatedFunctions: Functions = {};

  for (const currentFunctionName of functionNames) {
    const currentFunction: FunctionInfo = functions[currentFunctionName];
    const functionJSON = await getFunctionJSON({
      deps,
      function: currentFunction,
    });
    if (functionJSON) {
      validatedFunctions[currentFunctionName] = currentFunction;
    }
  }

  return validatedFunctions;
}

export async function validateJSTSFunctions({
  deps,
  functions,
  type = "ts",
}: {
  deps: AppDeps;
  functions: Functions;
  type: ProjectTypeKey;
}) {
  deps.logger.debug(
    `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
  );
  const functionNames = Object.keys(functions);
  let validatedFunctions: Functions = {};

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
