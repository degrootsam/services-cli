import fs from "fs";
import path from "path";
import BaseScaffolder from "..";
import {
  config,
  director,
  FunctionsUtils,
  logger,
  prompter,
  SOURCEPATH,
  spinner,
} from "../..";
import { FunctionInfo, Functions } from "../../functions/types";

// Scaffolder for functions projects and individual functions
//
export default class FunctionsScaffolder extends BaseScaffolder {
  async generateProject(
    name: string,
    force: boolean = false,
    javascript: boolean = false,
  ) {
    const functionTemplateURLs = config.scaffolder.templates.functions.project;
    let templateUrl = functionTemplateURLs.ts.url;

    if (javascript) {
      templateUrl = functionTemplateURLs.js.url;
    }

    await this.downloadTemplate(templateUrl, name, force);
  }
  async generateCodeGenFile(graphqlURL: string, accessToken: string) {
    if (!graphqlURL || !accessToken) {
      logger.debug({ graphqlURL, accessToken });
      throw new Error(
        "Unable to generate codegen.ts! Graphql URL or accessToken are empty",
      );
      return;
    }

    const targetDir = process.cwd();
    const tempDir = path.resolve(process.cwd(), "temp");

    logger.debug({ outputDir: targetDir, tempDir });

    const tempOutputDir = await this.copyTemplateFromLocal(
      config.scaffolder.templates.functions.typegen,
      tempDir,
      true,
    );

    if (!tempOutputDir) {
      throw new Error(
        `Something went wrong while downloading the template. Cannot find the template at ${tempDir}`,
      );
    }

    const templateFile = path.join(tempOutputDir, "codegen.template.ts");

    logger.debug(`Opening template file from ${templateFile}`);

    let templateContent = director.readFile(templateFile);

    if (!templateContent) {
      throw new Error(
        `The codegen template yielded no content! Please check if the file at ${tempOutputDir} exists and if it contains any content`,
      );
    }

    logger.debug("Replacing template content");

    templateContent = templateContent
      .replace("{{ graphqlURL }}", graphqlURL)
      .replace("{{ accessToken }}", accessToken);

    logger.debug(templateContent);

    const outputPath = path.join(targetDir, "codegen.ts");

    logger.debug(`Writing template file to ${outputPath}`);

    director.writeFile(outputPath, templateContent);

    logger.debug(`Cleaning temp files  at ${tempOutputDir}`);

    fs.rm(tempOutputDir, { recursive: true, force: true }, (err) => {
      if (err) {
        logger.error(err);
      }
      return true;
    });
  }
  async generateFunction(name: string) {
    spinner.start(`Creating a new function: ${name}`);
    const tsConfig = director.getTsConfig();

    const targetFileType = tsConfig ? "ts" : "js";
    const targetFileName = tsConfig
      ? `index.${targetFileType}`
      : `index.${targetFileType}`;

    const functionUtils = new FunctionsUtils();
    const functions = functionUtils.getFunctions();

    const existingFunctionNames = Object.keys(functions);

    if (existingFunctionNames.includes(name)) {
      throw new Error(`Function ${name} already exists!`);
    }

    const newFunctionTemplateDir =
      config.scaffolder.templates.functions.typegen;

    let indexTsJs = director.readFile(
      path.resolve(newFunctionTemplateDir, targetFileName),
    );
    let functionJSON = director.readFile(
      path.resolve(newFunctionTemplateDir, "function.json"),
    );

    if (!indexTsJs || !functionJSON) {
      logger.debug({ indexTsJs, functionJSON });
      throw new Error("The template file(s) yielded no content");
    }

    const parsedName = functionUtils.parseName(name);

    indexTsJs = indexTsJs.replace("functionName", parsedName);
    functionJSON = functionJSON.replaceAll("{{ functionName }}", parsedName);
    const functionDir = path.resolve(SOURCEPATH, name);

    const targetDir = path.resolve(functionDir, "1.0");

    director.createDir(targetDir);

    const newIndexTSPath = path.resolve(targetDir, targetFileName);
    const newFunctionJSONPath = path.resolve(targetDir, "function.json");

    director.writeFile(newIndexTSPath, indexTsJs);
    director.writeFile(newFunctionJSONPath, functionJSON);

    spinner.success(`Successfully created function ${name}`);

    const createTests = await prompter.confirm(
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
      await this.generateTestFiles(newFunction as FunctionInfo);
    }
  }

  async bumpFunction() {
    const functionsUtils = new FunctionsUtils();
    const functions = functionsUtils.getFunctions();
    const functionNames = Object.keys(functions);

    const selectedFunctionName = await prompter.select(
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

    const newVersion = await prompter.select(
      [newMinorVersionOption, newMajorVersionOption],
      "Please choose a new version",
      newMinorVersion.toString(),
    );

    const sourceDir = path.resolve(
      selectedFunction.path,
      selectedFunction.latestVersion,
    );

    const targetDir = path.resolve(selectedFunction.path, newVersion);

    spinner.start("Copying files...");
    await director.copyDir(sourceDir, targetDir);
    spinner.success(
      `${selectedFunctionName} successfully bumped to version ${newVersion}`,
    );

    const createTests = await prompter.confirm(
      "Would you like to create tests for this new version?",
      true,
    );

    if (createTests) {
      await this.generateTestFiles(selectedFunction);
    }
  }

  async generateTestFiles(
    func?: FunctionInfo,
    force?: boolean,
  ): Promise<string> {
    let parsedFunction: FunctionInfo = func as FunctionInfo;
    const functionsUtils = new FunctionsUtils();
    const tsConfig = director.getTsConfig();
    if (!parsedFunction) {
      const functions = functionsUtils.getFunctions();
      const functionNames = Object.keys(functions);
      const choices = functionNames.map((name) => ({
        name,
        value: name,
      }));
      const selectedFunction = await prompter.select(choices);
      parsedFunction = functions[selectedFunction];
    }

    const { path: functionDir, latestVersion } = parsedFunction;

    const functionName = path.basename(functionDir);
    const parsedFunctionName = functionsUtils.parseName(functionName);

    const extension = tsConfig ? "ts" : "js";

    const targetFile = `index.${extension}`;

    const targetDir = path.resolve(
      process.cwd(),
      config.tests.directory,
      functionName,
      latestVersion,
    );
    const targetPath = path.resolve(targetDir, targetFile);

    if (director.exists(targetPath) && !force) {
      throw new Error(
        `A test for ${parsedFunctionName}/${latestVersion} already exists! Use --force to overwrite`,
      );
    }
    director.createDir(targetDir);

    const templatePath = path.resolve(
      director.resolveCLITemplatePath(),
      config.scaffolder.templates.functions.test,
      targetFile,
    );

    let templateContent = director.readFile(templatePath);

    const importDir = path.resolve(functionDir, latestVersion);

    templateContent = templateContent.replaceAll(
      "// $importFunction",
      `import {{ functionName }} from "${importDir}"`,
    );

    templateContent = templateContent.replaceAll(
      "{{ functionName }}",
      parsedFunctionName,
    );

    templateContent = templateContent.replaceAll(
      "{{ functionVersion }}",
      latestVersion,
    );

    director.writeFile(targetPath, templateContent);

    logger.success(
      `Successfully created test for ${functionName}/${latestVersion}`,
    );

    return targetPath;
  }

  generateBarrelFunctionDeclaration(functions: Functions) {
    const functionsUtils = new FunctionsUtils();
    let result = "const fn = {\r\n";
    const functionNames = Object.keys(functions);
    functionNames.forEach((name, index) => {
      const currentFunction = functions[name];
      const { latestVersion } = currentFunction;
      const functionName = functionsUtils.parseName(name);
      const key = `\t"${functionName} ${latestVersion}"`;
      const value = `${functionName}_${latestVersion.replace(".", "_")}`;
      result += `${key}: ${value},\r\n`;
    });

    result += "};\r\n";
    return result;
  }

  generateBarrelImportDeclarations(functions: Functions) {
    const functionsUtils = new FunctionsUtils();
    let result = "";
    const functionNames = Object.keys(functions);
    functionNames.forEach((name) => {
      const currentFunction = functions[name];
      const { latestVersion } = currentFunction;
      const relativePath = `.${currentFunction.path.replace(process.cwd(), "")}/${latestVersion}`;
      const functionName = functionsUtils.parseName(name);
      result += `import { default as ${functionName}_${latestVersion.replace(".", "_")} } from "${relativePath}";\r\n`;
    });

    return result;
  }

  generateFunctionsBarrelFile(
    outputDir: string,
    functions: Functions,
    fileType: "js" | "ts" = "ts",
  ) {
    const functionsUtils = new FunctionsUtils();
    const validFunctions = functionsUtils.getValidFunctions(functions);

    let barrelContent = "";

    barrelContent += this.generateBarrelImportDeclarations(validFunctions);

    barrelContent += "\r\n";

    barrelContent += this.generateBarrelFunctionDeclaration(validFunctions);

    barrelContent += "\r\n";

    barrelContent += "export default fn;";

    const outputPath = path.resolve(outputDir, `index.${fileType}`);

    director.writeFile(outputPath, barrelContent);
  }
}
