import * as acorn from "acorn";
import tsPlugin from "acorn-typescript";
import * as acornWalk from "acorn-walk";
import chalk from "chalk";
import esbuild from "esbuild";
import * as fs from "fs";
import path from "path";
import { BUILDPATH, director, logger, SOURCEPATH, spinner } from "..";
import { ConfigManager } from "../config";
import FusionAuth from "../fusion-auth";
import { RequestHandler } from "../request-handler";
import { ExtractedFunctionInfo, FunctionInfo, Functions } from "../types";
export default class FunctionsUtils {
  private functionRegexp = new RegExp(
    /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/,
  );
  async buildFunctions(
    mode: "ts" | "js" = "ts",
    outdir: string = BUILDPATH,
    debug: boolean = false,
  ): Promise<string> {
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

    logger.info("Build complete! 🚀");
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
      `(export default async function ${functionDeclaration}|${functionDeclaration} as default|export default ${functionDeclaration})`,
      "g",
    );
    logger.debug(`Testing regex pattern: ${exportDefaultRegexp}`);
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

      const codeValidationInfo = this.parseCode(functionContent);

      //
      // const functionDeclaration = this.parseName(currentFunctionName);
      //
      // const isExportedDefault = this.functionIsExportedAsDefault(
      // 	functionContent,
      // 	functionDeclaration,
      // );
      //
      // if (!isExportedDefault) {
      // 	validatedFuctions[currentFunctionName] = {
      // 		...currentFunction,
      //
      // 		validation: {
      // 			info: "The function is not exported as default",
      // 			valid: false,
      // 		},
      // 	};
      // 	continue;
      // }
      //
      // validatedFuctions[currentFunctionName] = {
      // 	...currentFunction,
      // 	validation: {
      // 		valid: true,
      // 		info: "Success",
      // 	},
      // };
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

  // Using acorn with TypeScript plugin to support parsing .ts files.
  private acornParser: typeof acorn.Parser = (acorn.Parser as any).extend(
    tsPlugin(),
  );

  /** Parse code from a string (JavaScript or TypeScript) */
  parseCode(code: string): ExtractedFunctionInfo[] {
    // Parse the code as an ES Module (ESM)
    const ast = this.acornParser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
    }) as acorn.Node;

    return this.extractFunctions(ast);
  }

  /** Extract function information from the AST */
  private extractFunctions(ast: acorn.Node): ExtractedFunctionInfo[] {
    const functions: ExtractedFunctionInfo[] = [];
    // We will track names of exported bindings for functions
    const exportedNames = new Set<string>();
    let defaultExportFunction: acorn.Node | null = null;

    // First pass: collect exported names and identify default export function (if any)
    acornWalk.simple(ast, {
      ExportNamedDeclaration: (node: any) => {
        if (node.declaration) {
          // If the export directly declares a function or variable
          if (node.declaration.type === "FunctionDeclaration") {
            const fnName = node.declaration.id
              ? node.declaration.id.name
              : null;
            if (fnName) exportedNames.add(fnName);
          } else if (node.declaration.type === "VariableDeclaration") {
            // For exported variables, collect their names if they are initialized with functions
            for (const decl of node.declaration.declarations) {
              if (decl.id && decl.id.type === "Identifier") {
                // Mark this variable name as exported (actual function check later)
                exportedNames.add(decl.id.name);
              }
            }
          }
        }
        if (node.specifiers) {
          // e.g., export { foo, bar as baz }
          for (const spec of node.specifiers) {
            if (spec.type === "ExportSpecifier") {
              // const exportedName = spec.exported.name;
              const localName = spec.local.name;
              // Here we consider the local name (the function in this file)
              exportedNames.add(localName);
            }
          }
        }
      },
      ExportDefaultDeclaration: (node: any) => {
        // Export default could be a function declaration or expression
        defaultExportFunction = node.declaration;
      },
    });

    // Second pass: find all function definitions and record details
    acornWalk.ancestor(ast, {
      FunctionDeclaration: (node: any) => {
        const name = node.id ? node.id.name : null;
        if (!name) return; // anonymous function (shouldn't happen for decl)
        const isExported =
          exportedNames.has(name) || node === defaultExportFunction;
        const isDefault = node === defaultExportFunction;
        functions.push({
          name,
          isExported,
          isDefaultExport: isDefault,
          isAsync: node.async === true,
        });
      },
      FunctionExpression: (node: any, _state: any, ancestors: any[]) => {
        // Function expressions (including arrow functions) don't have their own name,
        // so we check if they are assigned to an identifier that is exported.
        const parent = ancestors[ancestors.length - 1]; // Get the parent node
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          const name = parent.id.name;
          const isExported =
            exportedNames.has(name) || node === defaultExportFunction;
          const isDefault = node === defaultExportFunction;
          functions.push({
            name,
            isExported,
            isDefaultExport: isDefault,
            isAsync: node.async === true,
          });
        }
      },
      ArrowFunctionExpression: (node: any, _state: any, ancestors: any[]) => {
        // Similar handling for arrow functions assigned to exported variables
        const parent = ancestors[ancestors.length - 1]; // Get the parent node
        if (
          parent?.type === "VariableDeclarator" &&
          parent.id.type === "Identifier"
        ) {
          const name = parent.id.name;
          const isExported =
            exportedNames.has(name) || node === defaultExportFunction;
          const isDefault = node === defaultExportFunction;
          functions.push({
            name,
            isExported,
            isDefaultExport: isDefault,
            isAsync: node.async === true,
          });
        }
      },
    });

    return functions;
  }
}
