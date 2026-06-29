import fs from "fs";
import path from "path";
import { downloadTemplate, copyTemplateFromLocal } from "..";
import type { AppDeps } from "../../types";
import {
  getFunctions,
  getValidFunctions,
  parseName,
  generateBarrelImportDeclarations,
  generateBarrelFunctionDeclaration,
} from "../../functions";
import type { FunctionInfo, Functions } from "../../functions/types";

export async function generateProject(
  deps: AppDeps,
  name: string,
  javascript: boolean = false,
): Promise<void> {
  const functionTemplateURLs =
    deps.config.scaffolder.templates.functions.project;
  let templateUrl = functionTemplateURLs.ts.url;

  if (javascript) {
    templateUrl = functionTemplateURLs.js.url;
  }

  await downloadTemplate(deps, templateUrl, name, deps.config.force);
}

export async function generateCodeGenFile(
  deps: AppDeps,
  graphqlURL: string,
  accessToken: string,
): Promise<void> {
  if (!graphqlURL || !accessToken) {
    deps.logger.debug({ graphqlURL, accessToken });
    throw new Error(
      "Unable to generate codegen.ts! Graphql URL or accessToken are empty",
    );
  }
  const { templates, cacheDir } = deps.config.scaffolder;

  const targetDir = process.cwd();
  const tempTemplatePath = path.resolve(cacheDir, "codegen");

  deps.logger.debug({ outputDir: targetDir, tempDir: tempTemplatePath });

  const templatePath = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    templates.functions.typegen,
  );

  let templateContent = deps.director.readFile(templatePath);

  if (!templateContent) {
    throw new Error(
      `The codegen template yielded no content! Please try again`,
    );
  }

  deps.logger.debug("Replacing template content");

  templateContent = templateContent
    .replace("{{ graphqlURL }}", graphqlURL)
    .replace("{{ accessToken }}", accessToken);

  deps.logger.debug(templateContent);

  const outputPath = path.join(targetDir, "codegen.ts");

  deps.logger.debug(`Writing template file to ${outputPath}`);

  deps.director.writeFile(outputPath, templateContent);

  deps.logger.debug(`Cleaning temp files at ${cacheDir}`);

  fs.rm(cacheDir, { recursive: true, force: true }, (err) => {
    if (err) {
      deps.logger.error(err);
    }
    return true;
  });

  deps.spinner.success("Successfully generated codegen.ts");
}

export async function generateFunction(
  deps: AppDeps,
  name: string,
): Promise<void> {
  const tsConfig = deps.director.getTsConfig();

  const targetFileType = tsConfig ? "ts" : "js";
  const targetFileName = `index.${targetFileType}`;

  const functions = getFunctions(deps);

  const existingFunctionNames = Object.keys(functions);

  if (existingFunctionNames.includes(name) && !deps.config.force) {
    throw new Error(`Function ${name} already exists!`);
  }

  const newFunctionTemplateDir = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    deps.config.scaffolder.templates.functions.new,
  );

  let indexTsJs = deps.director.readFile(
    path.resolve(newFunctionTemplateDir, targetFileName),
  );
  let functionJSON = deps.director.readFile(
    path.resolve(newFunctionTemplateDir, "function.json"),
  );

  if (!indexTsJs || !functionJSON) {
    deps.logger.debug({ indexTsJs, functionJSON });
    throw new Error("The template file(s) yielded no content");
  }

  const parsedName = parseName(name);

  indexTsJs = indexTsJs.replace("functionName", parsedName);
  functionJSON = functionJSON.replaceAll("{{ functionName }}", parsedName);
  const functionDir = path.resolve(deps.config.srcDir, name);

  const targetDir = path.resolve(functionDir, "1.0");

  deps.director.createDir(targetDir);

  const newIndexTSPath = path.resolve(targetDir, targetFileName);
  const newFunctionJSONPath = path.resolve(targetDir, "function.json");

  deps.director.writeFile(newIndexTSPath, indexTsJs);
  deps.director.writeFile(newFunctionJSONPath, functionJSON);

  deps.spinner.success(`Successfully created function ${parsedName}`);

  const createTests = await deps.prompter.confirm(
    "Would you like to create a test file as well?",
    true,
  );

  if (createTests) {
    const newFunction: Partial<FunctionInfo> = {
      fileType: targetFileType,
      latestVersion: "1.0",
      path: functionDir,
      versions: new Set(["1.0"]),
    };
    await generateTest(deps, newFunction as FunctionInfo);
  }
}

export async function bumpFunction(deps: AppDeps): Promise<void> {
  const functions = getFunctions(deps);
  const functionNames = Object.keys(functions);

  const selectedFunctionName = await deps.prompter.select(
    functionNames.map((func) => ({
      value: func,
      name: func,
    })),
    "Please choose a function to bump",
  );

  const selectedFunction = functions[selectedFunctionName];
  const [currentMajorVersion, currentMinorVersion] =
    selectedFunction.latestVersion.split(".").map(Number);

  const newMajorVersion = Number(currentMajorVersion) + 1;
  const newMinorVersion = Number(currentMinorVersion) + 1;

  const newMajorVersionOption = {
    name: newMajorVersion.toString() + ".0",
    value: newMajorVersion.toString() + ".0",
    description: "Major version",
  };

  const newMinorVersionOption = {
    name: `${currentMajorVersion}.${newMinorVersion}`,
    value: `${currentMajorVersion}.${newMinorVersion}`,
    description: "Minor version",
  };

  const newVersion = await deps.prompter.select(
    [newMinorVersionOption, newMajorVersionOption],
    "Please choose a new version",
    newMinorVersion.toString(),
  );

  const sourceDir = path.resolve(
    selectedFunction.path,
    selectedFunction.latestVersion,
  );

  const targetDir = path.resolve(selectedFunction.path, newVersion);

  await deps.director.copyDir(sourceDir, targetDir);

  deps.spinner.success(
    `Successfully bumped function ${selectedFunctionName} from ${selectedFunction.latestVersion} to ${newVersion}`,
  );

  const createTests = await deps.prompter.confirm(
    "Would you like to create tests for this new version?",
    true,
  );

  if (createTests) {
    await generateTest(deps, selectedFunction);
  }
}

export async function generateTest(
  deps: AppDeps,
  func?: FunctionInfo,
  force?: boolean,
): Promise<string> {
  let parsedFunction: FunctionInfo = func as FunctionInfo;
  const tsConfig = deps.director.getTsConfig();
  if (!parsedFunction) {
    const functions = getFunctions(deps);
    const functionNames = Object.keys(functions);
    const choices = functionNames.map((name) => ({
      name,
      value: name,
    }));
    const selectedFunction = await deps.prompter.select(choices);
    parsedFunction = functions[selectedFunction];
  }

  const { path: functionDir, latestVersion } = parsedFunction;

  const functionName = path.basename(functionDir);
  const parsedFunctionName = parseName(functionName);

  const extension = tsConfig ? "ts" : "js";

  const targetFile = `index.${extension}`;

  const targetDir = path.resolve(
    process.cwd(),
    deps.config.scaffolder.tests.directory,
    functionName,
    latestVersion,
  );
  const targetPath = path.resolve(targetDir, targetFile);

  if (deps.director.exists(targetPath) && !force) {
    throw new Error(
      `A test for ${parsedFunctionName}/${latestVersion} already exists! Use --force to overwrite`,
    );
  }
  deps.director.createDir(targetDir);

  const templatePath = path.resolve(
    deps.director.resolveCLITemplatePath(deps.config.scaffolder.templates.path),
    deps.config.scaffolder.templates.functions.test,
    targetFile,
  );

  let templateContent = deps.director.readFile(templatePath);

  const importDir = path.resolve(functionDir, latestVersion);
  const relativePath = path.relative(targetDir, importDir);

  templateContent = templateContent.replaceAll(
    "// $importFunction",
    `import {{ functionName }} from "${relativePath}"`,
  );

  templateContent = templateContent.replaceAll(
    "{{ functionName }}",
    parsedFunctionName,
  );

  templateContent = templateContent.replaceAll(
    "{{ functionVersion }}",
    latestVersion,
  );

  templateContent = templateContent.replaceAll(
    "// $callFunction",
    `await ${parsedFunctionName}()`,
  );

  deps.director.writeFile(targetPath, templateContent);

  deps.spinner.success(`Successfully created test for ${functionName}`);

  return targetPath;
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
