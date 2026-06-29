import chalk from "chalk";
import esbuild from "esbuild";
import * as fs from "fs";
import path from "path";
import { createCodeParser } from "../code-parser";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import FormData from "form-data";
import type { AppDeps } from "../types";
import { FunctionInfo, Functions } from "./types";
import { PublishResponse } from "./types";

const functionRegexp = /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/;

export function parseName(name: string): string {
  return name
    .split("-")
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}

export async function buildFunctions(
  deps: AppDeps,
  mode: "ts" | "js" = "ts",
  outdir: string = ".tmp",
  debug: boolean = false,
): Promise<string> {
  deps.logger.debug(
    `Building functions with mode ${mode} in destination ${outdir}`,
  );
  deps.spinner.start("Building functions...");
  const appDir = path.resolve(outdir, "app");
  const functionsOutputDir = path.resolve(appDir, "functions");
  const srcDir = deps.config.srcDir;
  const srcEntryPoint = `${srcDir}/**/*${deps.config.projectExtension}`;

  switch (mode) {
    case "ts":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".ts"),
      });
      break;
    case "js":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".js"),
      });
      break;
  }

  deps.spinner.success("Functions built successfully");
  return appDir;
}

export function getFunctions(deps: AppDeps): Functions {
  const srcDir = deps.config.srcDir;
  deps.logger.debug(`Getting functions in ${srcDir}`);

  const filePaths = deps.director.readDir(srcDir, true);
  const functions: Functions = {};

  filePaths.forEach((filePath) => {
    const match = filePath.match(functionRegexp);
    if (!match) return;
    const [, name, version, , fileType] = match;
    const fullPath = path.resolve(srcDir, name);
    if (!functions[name]) {
      functions[name] = {
        fileType: fileType as "ts" | "js",
        latestVersion: version,
        path: fullPath,
        validation: {
          valid: false,
          info: { isAsync: false, isDefaultExport: false, matchesName: false },
        },
        versions: new Set([version]),
      };
    } else {
      functions[name].versions.add(version);
    }
  });

  // Sort versions descending, set latestVersion
  const sortedFunctions: Functions = {};
  for (const name of Object.keys(functions)) {
    const fn = functions[name];
    const sortedVersions = [...fn.versions].sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );
    sortedFunctions[name] = {
      ...fn,
      versions: new Set(sortedVersions),
      latestVersion: sortedVersions[0],
    };
  }

  return sortedFunctions;
}

export function getBuildPath(
  func: FunctionInfo,
  v?: FunctionInfo["latestVersion"],
): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version ?? func.latestVersion, "index.js");
}

export function getFunctionFilePath(func: FunctionInfo, v?: string): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, `index.${func.fileType}`);
}

export function getFunctionJsonFilePath(
  func: FunctionInfo,
  v?: FunctionInfo["latestVersion"],
): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, "function.json");
}

export function functionIsExportedAsDefault(
  deps: AppDeps,
  functionContent: string,
  functionDeclaration: string,
): boolean {
  const exportDefaultRegexp = new RegExp(
    `(export default async function ${functionDeclaration}|${functionDeclaration} as default|export default ${functionDeclaration})`,
    "g",
  );
  deps.logger.debug(`Testing regex pattern: ${exportDefaultRegexp}`);
  return exportDefaultRegexp.test(functionContent);
}

export async function validateFunctions(
  deps: AppDeps,
  functions: Functions,
  type: "js" | "ts" = "ts",
): Promise<Functions> {
  deps.logger.debug(
    `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
  );
  const functionNames = Object.keys(functions);
  let validatedFunctions: Functions = {};

  deps.spinner.start("Validating functions...");
  const parser = createCodeParser(type, deps.logger);

  for (const currentFunctionName of functionNames) {
    const currentFunction = functions[currentFunctionName];
    const functionContent = deps.director.readFile(
      getFunctionFilePath(currentFunction),
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
      parseName(currentFunctionName),
    );
    validatedFunctions[currentFunctionName] = validatedFunction;
  }

  deps.spinner.success("Functions validated:");
  logValidatedFunctions(deps, validatedFunctions);

  return validatedFunctions;
}

export function logValidatedFunctions(
  deps: AppDeps,
  functions: Functions,
): void {
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const parsedName = parseName(name);
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

export function logUploadedFunction(
  deps: AppDeps,
  functionResult: {
    status: string;
    name: string;
    error?: string;
    version?: string;
  },
): void {
  const { status, name, error, version } = functionResult;
  const valid = status === "ok";
  const prefix = deps.logger.getValidationPrefix(valid);
  const color = deps.logger.getValidationColor(valid);
  const info = valid ? "successfully published" : error;
  const message = color(` - ${prefix} ${name}/${version}`) + `: ${info}`;
  console.log(message);
}

export function getValidFunctions(functions: Functions): Functions {
  return Object.keys(functions).reduce(
    (acc: Functions, functionName: string) => {
      if (functions[functionName].validation.valid) {
        acc[functionName] = { ...functions[functionName] };
      }
      return acc;
    },
    {},
  );
}

export function getFunctionsJSON(deps: AppDeps, functions: Functions): any[] {
  return Object.keys(functions).map((functionName) => {
    const currentFunction = functions[functionName];
    const { latestVersion, path: functionPath } = currentFunction;
    const functionJSONPath = path.resolve(
      functionPath,
      latestVersion,
      "function.json",
    );
    const functionJSONContent = deps.director.readFile(functionJSONPath) ?? "";
    try {
      const parsedContent = JSON.parse(functionJSONContent);
      return {
        ...parsedContent,
        options: JSON.stringify(parsedContent.options),
        paths: "{}",
        name: functionName,
        version: latestVersion,
      };
    } catch (error) {
      deps.logger.debug(error);
      throw new Error(
        `Unable parse functions JSON for function ${functionName}. Toggle verbose logging with --verbose for more information`,
      );
    }
  });
}

export async function uploadFunctions(
  deps: AppDeps,
  zipPath: string,
  functions: Functions,
): Promise<void> {
  const appUUID = await deps.config.getAppUUID();
  const form = new FormData();
  const functionsJson = getFunctionsJSON(deps, functions);
  form.append("functions", JSON.stringify(functionsJson));
  form.append("options", JSON.stringify({ compile: !deps.config.skipCompile }));
  form.append("file", fs.createReadStream(zipPath));
  const builderAPIURL = await deps.config.builderAPIURL();
  const request = new RequestHandler(builderAPIURL);
  const fusionAuth = new FusionAuth();
  const { token } = await fusionAuth.getToken();
  const response = await request.post(
    `/artifacts/actions/${appUUID}/functions`,
    form,
    { Authorization: `Bearer ${token}` },
  );
  console.log(response.status);
  if (response.status === 409) {
    const { created, updated, deleted } =
      (await response.json()) as PublishResponse;
    created.forEach((result) => logUploadedFunction(deps, result));
    updated.forEach((result) => logUploadedFunction(deps, result));
    deleted.forEach((result) => logUploadedFunction(deps, result));
  }
}

export function generateBarrelImportDeclarations(functions: Functions): string {
  let result = "";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const relativePath = `.${currentFunction.path.replace(process.cwd(), "")}/${latestVersion}`;
    const functionName = parseName(name);
    result += `import { default as ${functionName}_${latestVersion.replace(".", "_")} } from "${relativePath}";\r\n`;
  });
  return result;
}

export function generateBarrelFunctionDeclaration(
  functions: Functions,
): string {
  let result = "const fn = {\r\n";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const functionName = parseName(name);
    const key = `\t"${functionName} ${latestVersion}"`;
    const value = `${functionName}_${latestVersion.replace(".", "_")}`;
    result += `${key}: ${value},\r\n`;
  });
  result += "};\r\n";
  return result;
}

export function generateFunctionsBarrelFile(
  deps: AppDeps,
  outputDir: string,
  functions: Functions,
  fileType: "js" | "ts" = "ts",
): void {
  const validFunctions = getValidFunctions(functions);
  let barrelContent = "";
  barrelContent += generateBarrelImportDeclarations(validFunctions);
  barrelContent += "\r\n";
  barrelContent += generateBarrelFunctionDeclaration(validFunctions);
  barrelContent += "\r\n";
  barrelContent += "export default fn;";
  const outputPath = path.resolve(outputDir, `index.${fileType}`);
  deps.director.writeFile(outputPath, barrelContent);
}
