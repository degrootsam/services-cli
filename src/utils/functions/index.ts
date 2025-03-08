import chalk from "chalk";
import path from "path";
import { BUILDPATH, director, logger, SOURCEPATH, spinner } from "..";
import { FunctionInfo, Functions } from "../types";
import esbuild from "esbuild";
import fs from "fs";

export default class FunctionsUtils {
  private functionRegexp = new RegExp(
    /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/,
  );
  async buildFunctions(mode: "ts" | "js" = "ts", outdir: string = BUILDPATH) {
    switch (mode) {
      case "ts":
        await esbuild.build({
          entryPoints: ["functions/**/*.ts"],
          outdir: path.resolve(outdir, "app", "functions"),
          platform: "node",
          format: "esm",
          target: "esnext",
          bundle: false,
        });

        fs.cpSync("functions", "dist", {
          recursive: true,
          filter: (src) => !src.endsWith(".ts"),
        });

        break;
      case "js":
    }

    logger.info("Build complete! 🚀");
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
    const tsConfig = director.getTsConfig();
    const srcDirectory = director.readDir(SOURCEPATH, true);

    logger.debug(`Using regex to find functions`);
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
            valid: Boolean(),
            info: String(),
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
      `(export default async function ${functionDeclaration}|${functionDeclaration} as default)`,
      "g",
    );
    return exportDefaultRegexp.test(functionContent);
  }

  validateFunctions(functions: Functions): Functions {
    const functionNames = Object.keys(functions);
    let validatedFuctions: Functions = {};

    spinner.start("Validating functions...");
    for (let i = 0; i < functionNames.length; i++) {
      const currentFunctionName = functionNames[i];
      const currentFunction = functions[currentFunctionName];
      const functionContent = director.readFile(
        this.getFunctionFilePath(currentFunction),
      );

      if (!functionContent) {
        validatedFuctions[currentFunctionName] = {
          ...currentFunction,
          validation: {
            info: "The function yielded no content",
            valid: false,
          },
        };
        continue;
      }

      const functionDeclaration = this.parseName(currentFunctionName);

      const isExportedDefault = this.functionIsExportedAsDefault(
        functionContent,
        functionDeclaration,
      );

      if (!isExportedDefault) {
        validatedFuctions[currentFunctionName] = {
          ...currentFunction,

          validation: {
            info: "The function is not exported as default",
            valid: false,
          },
        };
        continue;
      }

      validatedFuctions[currentFunctionName] = {
        ...currentFunction,
        validation: {
          valid: true,
          info: "Success",
        },
      };
    }
    spinner.stop();
    logger.info("Your functions were validated:");
    logger.functions(validatedFuctions);

    return validatedFuctions;
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
