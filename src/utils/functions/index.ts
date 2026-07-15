import path from "path";
import type { AppDeps } from "../types";
import {
  generateBarrelFunctionDeclaration,
  generateBarrelImportDeclarations,
  generateFunctionsBarrelFile,
} from "./barrel";
import { buildFunctions } from "./build";
import { getFunctions, getFunctionsJSON, getValidFunctions } from "./get";
import { logUploadedFunction, logValidatedFunctions } from "./log";
import { FunctionInfo } from "./types";
import { uploadFunctions } from "./upload";
import { validateFunctions } from "./validate";

export {
  buildFunctions,
  generateBarrelFunctionDeclaration,
  generateBarrelImportDeclarations,
  generateFunctionsBarrelFile,
  getFunctions,
  getFunctionsJSON,
  getValidFunctions,
  logUploadedFunction,
  logValidatedFunctions,
  uploadFunctions,
  validateFunctions,
};

export function parseName({ name }: { name: string }): string {
  return name
    .split("-")
    .map((part, i) =>
      i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("");
}

export function getBuildPath({
  func,
  v,
}: {
  func: FunctionInfo;
  v?: FunctionInfo["latestVersion"];
}): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version ?? func.latestVersion, "index.js");
}

export function getFunctionFilePath({
  func,
  v,
}: {
  func: FunctionInfo;
  v?: string;
}): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, `index.${func.fileType}`);
}

export function getFunctionJsonFilePath({
  func,
  v,
}: {
  func: FunctionInfo;
  v?: FunctionInfo["latestVersion"];
}): string {
  const version = v ?? func.latestVersion;
  return path.resolve(func.path, version, "function.json");
}

export function functionIsExportedAsDefault({
  deps,
  functionContent,
  functionDeclaration,
}: {
  deps: AppDeps;
  functionContent: string;
  functionDeclaration: string;
}): boolean {
  const exportDefaultRegexp = new RegExp(
    `(export default async function ${functionDeclaration}|${functionDeclaration} as default|export default ${functionDeclaration})`,
    "g",
  );
  deps.logger.debug(`Testing regex pattern: ${exportDefaultRegexp}`);
  return exportDefaultRegexp.test(functionContent);
}
