import chalk from "chalk";
import esbuild from "esbuild";
import * as fs from "fs";
import path from "path";
import { BUILDPATH, director, logger, SOURCEPATH, spinner } from "..";
import CodeParser from "../code-parser";
import { ConfigManager } from "../config";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import { FunctionInfo, Functions } from "../types";

export default class FunctionsUtils {
  private functionRegexp = new RegExp(
    /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/,
  );
  async buildFunctions(
    mode: "ts" | "js" = "ts",
    outdir: string = BUILDPATH,
    debug: boolean = false,
  ): Promise<string> {
    logger.debug(
      `Building functions with mode ${mode} in destination ${outdir}`,
    );
    spinner.start("Building functions...");
    const functionsOutputDir = path.resolve(outdir, "app", "functions");
    switch (mode) {
      case "ts":
        await esbuild.build({
          entryPoints: ["functions/**/*.ts"],
          outdir: functionsOutputDir,
          platform: "node",
          format: "esm",
          target: "es2022",
          minify: !debug,
        });

        fs.cpSync("functions", functionsOutputDir, {
          recursive: true,
          filter: (src) => !src.endsWith(".ts"),
        });

        break;
      case "js":
        await esbuild.build({
          entryPoints: ["functions/**/*.js"],
          outdir: functionsOutputDir,
          platform: "node",
          format: "esm",
          target: "es2022",
          minify: !debug,
        });

        fs.cpSync("functions", functionsOutputDir, {
          recursive: true,
          filter: (src) => {
            logger.debug(src);
            return !src.endsWith(".js");
          },
        });

        break;
    }

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
        return JSON.parse(functionJSONContent);
      } catch (error) {
        logger.debug(error);
        throw new Error(
          `Unable parse functions JSON for function ${functionName}. Toggle verbose logging with --verbose for more information`,
        );
      }
    });
    logger.debug({ functionsJSON });
    return functionsJSON;
  }

  async uploadFunctions(zipPath: string, functions: Functions) {
    const config = new ConfigManager();
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

    console.log(response.data, response.error);
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
    const srcDirectory = director.readDir(SOURCEPATH, true);

    const functionPaths: string[] = srcDirectory.filter((v: string) => {
      const result = this.functionRegexp.test(v);
      logger.debug(
        `Regex test result for ${v}: ${result ? chalk.green(result) : chalk.red(result)}`,
      );
      return result;
    });

    logger.debug("Found the following functions", functionPaths);
    const functions = functionPaths.reduce(this.reduceFunctionDirs, {});
    logger.debug("Parsed functions object", functions);

    return functions;
  }

  private reduceFunctionDirs = (
    acc: Functions,
    filePath: string,
  ): Functions => {
    {
      const match = filePath.match(this.functionRegexp);

      if (!match) return acc; // Skip if it doesn't match

      const [, funcName, version, fileName, fileType] = match;

      if (!acc[funcName]) {
        acc[funcName] = {
          versions: [],
          latestVersion: version,
          path: path.resolve(SOURCEPATH, filePath.split(funcName)[0], funcName),
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

      if (!acc[funcName].versions.includes(version)) {
        acc[funcName].versions.push(version);
      }

      // Ensure latestVersion is the highest
      acc[funcName].latestVersion = acc[funcName].versions.sort(
        (a, b) => parseFloat(b) - parseFloat(a),
      )[0];

      return acc;
    }
  };

  getBuildPath(func: FunctionInfo, v?: FunctionInfo["latestVersion"]) {
    const version = v ? v : func.latestVersion;
    return path.resolve(func.path, version ?? func.latestVersion, "index.js");
  }

  getFunctionFilePath(func: FunctionInfo, v?: FunctionInfo["latestVersion"]) {
    const version = v ? v : func.latestVersion;
    return path.resolve(func.path, version, `index.${func.fileType}`);
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

  validateFunctions(functions: Functions, type: "js" | "ts" = "ts"): Functions {
    logger.debug(
      `Validating functions in ${type === "js" ? "JavaScript" : "TypeScript"}`,
    );
    const functionNames = Object.keys(functions);
    let validatedFunctions: Functions = {};

    spinner.start("Validating functions...");
    const parser = new CodeParser(type);
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
    logger.functions(validatedFunctions);

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
