import fs from "fs";
import path from "path";
import BaseScaffolder from "..";
import {
  config,
  director,
  FunctionsUtils,
  logger,
  prompter,
  spinner,
} from "../..";
import { Config } from "../../types";

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
    const srcPath = tsConfig ? "src" : "functions";

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

    indexTsJs = indexTsJs.replace("functionName", name);
    functionJSON = functionJSON.replaceAll("{{ functionName }}", name);

    const targetDir = path.resolve(srcPath, name, "1.0");

    director.createDir(targetDir);

    const newIndexTSPath = path.resolve(targetDir, indexTsJsFileName);
    const newFunctionJSONPath = path.resolve(targetDir, "function.json");

    director.writeFile(newIndexTSPath, indexTsJs);
    director.writeFile(newFunctionJSONPath, functionJSON);

    spinner.succeed(`Function ${name} created`);
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
    spinner.succeed(`Function successfully bumped to version ${newVersion}`);
  }
}
