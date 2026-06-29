import chalk from "chalk";
import esbuild from "esbuild";
import * as fs from "fs";
import path from "path";
import { config, director, logger, spinner, CodeParser } from "..";
import { ConfigManager } from "../config";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import { FunctionInfo, Functions } from "../functions/types";
import JsonSchema from "../json-schema";
import FormData from "form-data";
import { PublishResponse } from "./types";

export default class FunctionsUtils {
  private functionRegexp = new RegExp(
    /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/,
  );
  async buildFunctions(
    mode: "ts" | "js" = "ts",
    outdir: string = ".tmp",
    debug: boolean = false,
  ): Promise<string> {
    logger.debug(
      `Building functions with mode ${mode} in destination ${outdir}`,
    );
    spinner.start("Building functions...");
    const appDir = path.resolve(outdir, "app");
    const functionsOutputDir = path.resolve(appDir, "functions");
    const srcDir = config.srcDir;
    const srcEntryPoint = `${srcDir}/**/*${config.projectExtension}`;
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
          filter: (src) => {
            logger.debug(src);
            return !src.endsWith(".js");
          },
        });

        break;
    }

    const packageSourcePath = path.resolve(process.cwd(), "package.json");
    const packageTargetPath = path.resolve(appDir, "package.json");

    fs.copyFileSync(packageSourcePath, packageTargetPath);

    spinner.success("Build complete! 🚀");
    return functionsOutputDir;
  }

  getFunctionsJSON(functions: Functions): any[] {
    const functionNames = Object.keys(functions);
    const functionsJSON = functionNames.map((functionName) => {
      const currentFunction = functions[functionName];
      const { latestVersion, path: functionPath } = currentFunction;

      const functionJSONPath = path.resolve(
        functionPath,
        latestVersion,
        "function.json",
      );

      const functionJSONContent = director.readFile(functionJSONPath) ?? "";

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
        logger.debug(error);
        throw new Error(
          `Unable parse functions JSON for function ${functionName}. Toggle verbose logging with --verbose for more information`,
        );
      }
    });
    return functionsJSON;
  }

  async uploadFunctions(zipPath: string, functions: Functions) {
    const appUUID = await config.getAppUUID();

    const form = new FormData();
    const functionsJson = this.getFunctionsJSON(functions);
    form.append("functions", JSON.stringify(functionsJson));
    form.append("options", JSON.stringify({ compile: !config.skipCompile }));
    form.append("file", fs.createReadStream(zipPath));
    const builderAPIURL = await config.builderAPIURL();
    const request = new RequestHandler(builderAPIURL);
    const fusionAuth = new FusionAuth();

    const { token } = await fusionAuth.getToken();

    const response = await request.post(
      `/artifacts/actions/${appUUID}/functions`,
      form,
      {
        Authorization: `Bearer ${token}`,
      },
    );

    console.log(response.status);

    switch (response.status) {
      case 409:
        const { created, updated, deleted, message } =
          (await response.json()) as PublishResponse;
        created.forEach((result) => logger.uploadedFunction(result));
        updated.forEach((result) => logger.uploadedFunction(result));
        deleted.forEach((result) => logger.uploadedFunction(result));
    }
  }

  parseName(name: string): string {
    return name
      .split("-")
      .map((name, i) =>
        i === 0
          ? name
          : name.replace(name.at(0) ?? "", name.at(0)?.toUpperCase() ?? ""),
      )
      .join("");
  }

  getFunctions(): Functions {
    const srcDir = config.srcDir;
    const srcDirectory = director.readDir(srcDir, true);

    const functionPaths: string[] = srcDirectory
      .filter((v) => v.endsWith(".ts") || v.endsWith(".js"))
      .filter((v: string) => {
        const result = this.functionRegexp.test(v);
        logger.debug(
          `Regex test result for ${v}: ${result ? chalk.green(result) : chalk.red(result)}`,
        );
        return result;
      });

    logger.debug("Found the following functions", functionPaths);
    const unsortedFunctions = functionPaths.reduce(this.reduceFunctionDirs, {});
    const functions = this.sortFunctions(unsortedFunctions);
    logger.debug("Parsed functions object", functions);

    return functions;
  }

  private reduceFunctionDirs = (
    acc: Functions,
    filePath: string,
  ): Functions => {
    const match = filePath.match(this.functionRegexp);
    if (!match) return acc;

    const [, funcName, version, fileName, fileType] = match;

    if (!acc[funcName]) {
      acc[funcName] = {
        versions: new Set<string>(),
        latestVersion: version,
        path: path.resolve(
          config.srcDir,
          filePath.split(funcName)[0],
          funcName,
        ),
        validation: {
          valid: false,
          info: {
            isAsync: false,
            isDefaultExport: false,
            matchesName: false,
          },
        },
        fileType: fileType as "js" | "ts",
      };
    }

    acc[funcName].versions.add(version);

    return acc;
  };

  sortFunctions(functions: Functions): Functions {
    const sortedFunctions: Functions = {};

    for (const [name, fn] of Object.entries(functions)) {
      const sortedVersions = Array.from(fn.versions).sort(
        (a, b) => parseFloat(b) - parseFloat(a),
      );

      sortedFunctions[name] = {
        ...fn,
        versions: new Set(sortedVersions),
        latestVersion: sortedVersions[0],
      };
    }

    return sortedFunctions;
  }

  getBuildPath(func: FunctionInfo, v?: FunctionInfo["latestVersion"]) {
    const version = v ? v : func.latestVersion;
    return path.resolve(func.path, version ?? func.latestVersion, "index.js");
  }

  getFunctionFilePath(func: FunctionInfo, v?: FunctionInfo["latestVersion"]) {
    const version = v ? v : func.latestVersion;
    return path.resolve(func.path, version, `index.${func.fileType}`);
  }

  getFunctionJsonFilePath(
    func: FunctionInfo,
    v?: FunctionInfo["latestVersion"],
  ) {
    const version = v ? v : func.latestVersion;
    return path.resolve(func.path, version, "function.json");
  }

  functionIsExportedAsDefault(
    functionContent: string,
    functionDeclaration: string,
  ): boolean {
    const exportDefaultRegexp = new RegExp(
      `(export default async function ${functionDeclaration}|${functionDeclaration} as default|export default ${functionDeclaration})`,
      "g",
    );
    logger.debug(`Testing regex pattern: ${exportDefaultRegexp}`);
    return exportDefaultRegexp.test(functionContent);
  }

  async validateFunctions(
    functions: Functions,
    type: "js" | "ts" = "ts",
  ): Promise<Functions> {
    logger.debug(
      `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
    );
    const functionNames = Object.keys(functions);
    let validatedFunctions: Functions = {};

    spinner.start("Validating functions...");
    const parser = new CodeParser(type);
    const jsonSchema = new JsonSchema();
    for (let i = 0; i < functionNames.length; i++) {
      const currentFunctionName = functionNames[i];
      const currentFunction = functions[currentFunctionName];
      const functionContent = director.readFile(
        this.getFunctionFilePath(currentFunction),
      );

      if (!functionContent) {
        validatedFunctions[currentFunctionName] = {
          ...currentFunction,
          validation: {
            ...currentFunction.validation,
            valid: false,
          },
        };
        continue;
      }

      const validatedFunction = parser.validateFunction(
        functionContent,
        currentFunction,
        this.parseName(currentFunctionName),
      );
      validatedFunctions[currentFunctionName] = validatedFunction;
    }
    spinner.success("Functions validated:");
    logger.validatedFunctions(validatedFunctions);

    return validatedFunctions;
  }

  getValidFunctions(functions: Functions) {
    return Object.keys(functions).reduce(
      (acc: Functions, functionName: string) => {
        const currentFunction = functions[functionName];
        if (currentFunction.validation.valid) {
          acc[functionName] = {
            ...currentFunction,
          };
        }
        return acc;
      },
      {},
    );
  }
}
