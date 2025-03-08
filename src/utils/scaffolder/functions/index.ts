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
import { Config, Functions } from "../../types";

// Scaffolder for functions projects and individual functions
export default class FunctionsScaffolder extends BaseScaffolder {
  private config: Config = config.getConfig();

  async generateProject(
    name: string,
    force: boolean = false,
    javascript: boolean = false,
  ) {
    const functionTemplateURLs = this.config.scaffolder.projects.functions;
    let templateUrl = functionTemplateURLs.typescript;

    if (javascript) {
      templateUrl = functionTemplateURLs.javascript;
    }

    await this.downloadTemplate(templateUrl, name, force);

    logger.info(
      `Functions project "${name}" created!

  To start developing:
  - cd ${name}
  - npm install ${!javascript ? "\r\n  - npm run build" : ""}
  - bbs functions publish
    `,
    );
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

    const tempOutputDir = await this.downloadTemplate(
      this.config.scaffolder.codeGeneration.gqlCodeGen,
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

    const indexTsJsFileName = tsConfig ? "index.ts" : "index.js";

    const functionUtils = new FunctionsUtils();
    const functions = functionUtils.getFunctions();

    const existingFunctionNames = Object.keys(functions);

    if (existingFunctionNames.includes(name)) {
      throw new Error(`Function ${name} already exists!`);
    }

    const newFunctionTemplateDir = path.resolve(
      director.resolveCLITemplatePath(),
      "scaffolder",
      "functions",
      "new",
    );

    let indexTsJs = director.readFile(
      path.resolve(newFunctionTemplateDir, indexTsJsFileName),
    );
    let functionJSON = director.readFile(
      path.resolve(newFunctionTemplateDir, "function.json"),
    );

    if (!indexTsJs || !functionJSON) {
      logger.debug({ indexTsJs, functionJSON });
      throw new Error("The template file(s) yielded no content");
    }

    const parsedName = functionUtils.parseName(name);

    logger.info(parsedName);

    indexTsJs = indexTsJs.replace("functionName", parsedName);
    functionJSON = functionJSON.replaceAll("{{ functionName }}", parsedName);

    const targetDir = path.resolve(SOURCEPATH, name, "1.0");

    director.createDir(targetDir);

    const newIndexTSPath = path.resolve(targetDir, indexTsJsFileName);
    const newFunctionJSONPath = path.resolve(targetDir, "function.json");

    director.writeFile(newIndexTSPath, indexTsJs);
    director.writeFile(newFunctionJSONPath, functionJSON);

    spinner.success(`Function ${name} created`);
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
  }

  generateBarrelFunctionDeclaration(functions: Functions) {
    const functionsUtils = new FunctionsUtils();
    let result = "const fn = {\r\n";
    const functionNames = Object.keys(functions);
    functionNames.forEach((name, index) => {
      const currentFunction = functions[name];
      const { latestVersion } = currentFunction;
      const functionName = functionsUtils.parseName(name);
      const key = `"${functionName} ${latestVersion}"`;
      const value = `${functionName}_${latestVersion.replace(".", "_")}`;
      result += `${key}: ${value},\r\n`;
    });

    result += "};";
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

  generateFunctionsBarrelFile(outputDir: string, fileType: "js" | "ts" = "ts") {
    const functionsUtils = new FunctionsUtils();
    const functions = functionsUtils.getFunctions();
    const validatedFunctions = functionsUtils.validateFunctions(functions);
    const validFunctions = functionsUtils.getValidFunctions(validatedFunctions);

    let barrelContent = "";

    barrelContent += this.generateBarrelImportDeclarations(validFunctions);

    barrelContent += "\r\n";

    barrelContent += this.generateBarrelFunctionDeclaration(validFunctions);

    const outputPath = path.resolve(outputDir, `index.${fileType}`);

    director.writeFile(outputPath, barrelContent);
  }
}
