import path from "path";
import { AppDeps } from "../types";
import { Functions } from "./types";

const functionRegexp = /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(ts|js)$/;

export function getValidFunctions({
  functions,
}: {
  functions: Functions;
}): Functions {
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

export function getFunctions({ deps }: { deps: AppDeps }): Functions {
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

export async function getFunctionsJSON({
  deps,
  functions,
}: {
  deps: AppDeps;
  functions: Functions;
}): Promise<any[]> {
  return Object.keys(functions).map(async (functionName) => {
    const currentFunction = functions[functionName];
    const { latestVersion, path: functionPath } = currentFunction;
    const functionJSONPath = path.resolve(
      functionPath,
      latestVersion,
      "function.json",
    );
    const functionJSONContent =
      (await deps.director.readFile(functionJSONPath)) ?? "";
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
