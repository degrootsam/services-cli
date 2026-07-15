import path from "path";
import { parseName } from ".";
import { AppDeps } from "../types";
import { getValidFunctions } from "./get";
import { Functions } from "./types";

export function generateBarrelImportDeclarations({
  functions,
}: {
  functions: Functions;
}): string {
  let result = "";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const relativePath = `.${currentFunction.path.replace(process.cwd(), "")}/${latestVersion}`;
    const functionName = parseName({ name });
    result += `import { default as ${functionName}_${latestVersion.replace(".", "_")} } from "${relativePath}";\r\n`;
  });
  return result;
}

export function generateBarrelFunctionDeclaration({
  functions,
}: {
  functions: Functions;
}): string {
  let result = "const fn = {\r\n";
  Object.keys(functions).forEach((name) => {
    const currentFunction = functions[name];
    const { latestVersion } = currentFunction;
    const functionName = parseName({ name });
    const key = `\t"${functionName} ${latestVersion}"`;
    const value = `${functionName}_${latestVersion.replace(".", "_")}`;
    result += `${key}: ${value},\r\n`;
  });
  result += "};\r\n";
  return result;
}

export function generateFunctionsBarrelFile({
  deps,
  outputDir,
  functions,
  fileType = "ts",
}: {
  deps: AppDeps;
  outputDir: string;
  functions: Functions;
  fileType?: "js" | "ts";
}): void {
  const validFunctions = getValidFunctions({ functions });
  let barrelContent = "";
  barrelContent += generateBarrelImportDeclarations({
    functions: validFunctions,
  });
  barrelContent += "\r\n";
  barrelContent += generateBarrelFunctionDeclaration({
    functions: validFunctions,
  });
  barrelContent += "\r\n";
  barrelContent += "export default fn;";
  const outputPath = path.resolve(outputDir, `index.${fileType}`);
  deps.director.writeFile(outputPath, barrelContent);
}
