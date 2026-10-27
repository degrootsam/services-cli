import path from "path";
import { AppDeps, ProjectTypeKey } from "../types.js";
import { FunctionInfo, Functions } from "./types.js";

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

export async function getFunctions({
  deps,
  type,
}: {
  deps: AppDeps;
  type?: ProjectTypeKey;
}): Promise<Functions> {
  const srcDir = deps.config.srcDir;
  deps.logger.debug(`Getting functions in ${srcDir}`);

  const filePaths = await deps.director.readDir(srcDir, true);
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

export async function getFunctionJSON({
  deps,
  function: fn,
}: {
  deps: AppDeps;
  function: FunctionInfo;
}) {
  deps.logger.debug("Fetching function.json...");

  const { latestVersion, path: functionPath } = fn;
  const functionJSONPath = path.resolve(
    functionPath,
    latestVersion,
    "function.json",
  );

  deps.logger.debug(`function.json path: ${functionJSONPath}`);

  const functionJSONContent = await deps.director.readFile(
    functionJSONPath,
    true,
  );

  deps.logger.debug(`functions.json content: ${functionJSONContent}`);

  try {
    return JSON.parse(functionJSONContent);
  } catch (error) {
    deps.logger.debug(error);
    throw new Error(
      `Failed to parse ${functionJSONPath}. Toggle verbose logging with --verbose for more information`,
    );
  }
}

export async function getFunctionsJSON({
  deps,
  functions,
}: {
  deps: AppDeps;
  functions: Functions;
}): Promise<any[]> {
  return Promise.all(
    Object.keys(functions).map(async (functionName) => {
      const { latestVersion } = functions[functionName];
      const functionJSON = await getFunctionJSON({
        deps,
        function: functions[functionName],
      });
      return {
        ...functionJSON,
        options: JSON.stringify(functionJSON.options),
        paths: "{}",
        name: functionName,
        version: latestVersion,
      };
    }),
  );
}
