import path from "path";
import { AppDeps } from "../index.js";
import { SelectChoice } from "../prompter/index.js";
import { FunctionInfo } from "./types.js";
import { getFunctions } from "./get.js";
import { generateTest } from "./gen/test.js";
import { parseName } from "./index.js";

export async function createFunction({
  name,
  deps,
}: {
  name: string;
  deps: AppDeps;
}) {
  const projectType = await deps.director.getProjectType();

  if (projectType === "wasm") {
    await createWASMFunction({ name, deps });
  } else {
    createJsTsFunction({ name, deps });
  }
}

const WASM_FUNCTION_TYPES: SelectChoice[] = [
  {
    name: "TypeScript",
    value: "ts",
  },
  {
    name: "Rust",
    value: "rust",
  },
  {
    name: "GO",
    value: "go",
  },
];

export async function createWASMFunction({
  name,
  deps,
}: {
  name: string;
  deps: AppDeps;
}) {
  if (!name)
    throw new Error("Failed to create a WASM function: name is required!");
  const choice = await deps.prompter.select(
    WASM_FUNCTION_TYPES,
    "What language would you like to use for this function?",
  );

  if (!WASM_FUNCTION_TYPES.map((t) => t.value).includes(choice)) {
    throw new Error(`"${choice} is not a valid language option!`);
  }

  await deps.director.createDir(deps.config.srcDir);

  const functionSourceDir = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    deps.config.scaffolder.templates.functions.new,
    "wasm",
    choice,
  );

  const functions = await getFunctions({ deps, type: "wasm" });
  const existingFunctionNames = Object.keys(functions);
  if (existingFunctionNames.includes(name) && !deps.config.force) {
    throw new Error(`Function ${name} already exists!`);
  }

  const targetDir = path.resolve(deps.config.srcDir, name);

  await deps.director.copyDir(functionSourceDir, targetDir);
}

export async function createJsTsFunction({
  name,
  deps,
}: {
  name: string;
  deps: AppDeps;
}) {
  const projectType = await deps.director.getProjectType();
  if (projectType === "wasm")
    throw new Error("Cannot create JS/TS function inside a WASM project");

  const targetFileName = `index.${projectType}`;

  const functions = await getFunctions({ deps });

  const existingFunctionNames = Object.keys(functions);

  if (existingFunctionNames.includes(name) && !deps.config.force) {
    throw new Error(`Function ${name} already exists!`);
  }

  const newFunctionTemplateDir = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    deps.config.scaffolder.templates.functions.new,
    projectType,
  );

  let indexTsJs = await deps.director.readFile(
    path.resolve(newFunctionTemplateDir, targetFileName),
  );

  let functionJSON = await deps.director.readFile(
    path.resolve(newFunctionTemplateDir, "function.json"),
  );

  if (!indexTsJs || !functionJSON) {
    deps.logger.debug({ indexTsJs, functionJSON });
    throw new Error("The template file(s) yielded no content");
  }

  const parsedName = parseName({ name });

  indexTsJs = indexTsJs.replace("functionName", parsedName);
  functionJSON = functionJSON.replaceAll("{{ functionName }}", parsedName);
  const functionDir = path.resolve(deps.config.srcDir, name);

  const targetDir = path.resolve(functionDir, "1.0");

  await deps.director.createDir(targetDir);

  const newIndexTSPath = path.resolve(targetDir, targetFileName);
  const newFunctionJSONPath = path.resolve(targetDir, "function.json");

  await deps.director.writeFile(newIndexTSPath, indexTsJs);
  await deps.director.writeFile(newFunctionJSONPath, functionJSON);

  deps.spinner.success(`Successfully created function ${parsedName}`);

  const createTests = await deps.prompter.confirm(
    "Would you like to create a test file as well?",
    true,
  );

  if (createTests) {
    const newFunction: Partial<FunctionInfo> = {
      fileType: projectType,
      latestVersion: "1.0",
      path: functionDir,
      versions: new Set(["1.0"]),
    };
    await generateTest({ deps, func: newFunction as FunctionInfo });
  }
}
