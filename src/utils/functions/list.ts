import type { AppDeps } from "../types.js";
import { getFunctions } from "./get.js";
import { validateFunctions } from "./validate.js";

export type FunctionListItem = {
  name: string;
  latestVersion: string;
  versions: string[];
  valid: boolean;
};

export async function listFunctions({
  deps,
}: {
  deps: AppDeps;
}): Promise<FunctionListItem[]> {
  const type = await deps.director.getProjectType();
  const functions = await getFunctions({ deps, type });
  const validated = await validateFunctions({
    deps,
    functions,
    type,
    log: false,
  });

  return Object.keys(functions)
    .sort()
    .map((name) => ({
      name,
      latestVersion: functions[name].latestVersion,
      versions: [...functions[name].versions],
      valid: validated[name]?.validation.valid ?? false,
    }));
}

export function formatFunctionList({
  deps,
  functions,
}: {
  deps: AppDeps;
  functions: FunctionListItem[];
}): string[] {
  if (functions.length === 0) {
    return [`No functions found in ${deps.config.srcDir}`];
  }

  const nameWidth = Math.max(...functions.map((fn) => fn.name.length));
  const versionWidth = Math.max(
    ...functions.map((fn) => fn.latestVersion.length),
  );

  return functions.map(({ name, latestVersion, versions, valid }) => {
    const color = deps.logger.getValidationColor(valid);
    const prefix = deps.logger.getValidationPrefix(valid);
    const line = `${prefix} ${name.padEnd(nameWidth)}  ${latestVersion.padEnd(versionWidth)}`;
    const allVersions = versions.length > 1 ? `  (${versions.join(", ")})` : "";
    return (color(line) + allVersions).trimEnd();
  });
}
