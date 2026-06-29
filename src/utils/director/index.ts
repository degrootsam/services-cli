import fs from "fs-extra";
import path from "path";
import {
  config,
  director,
  Git,
  isErrorWithMessage,
  logger,
  prompter,
} from "..";
import { spawn, SpawnOptions } from "child_process";
import archiver from "archiver";
import os from "os";
import chalk from "chalk";

export default class Director {
  resolveCLIPath(): string {
    return __dirname.split("/dist/")[0];
  }

  resolveCLITemplatePath(): string {
    return path.resolve(
      this.resolveCLIPath(),
      config.scaffolder.templates.path,
    );
  }

  createDir(name: string) {
    logger.debug(`Creating directory in ${name}`);
    fs.mkdirSync(name, { recursive: true });
  }

  readDir(path: string, recursive: boolean = false): string[] {
    logger.debug(`Reading directory at ${path}`);
    const directory = fs.readdirSync(path, {
      recursive,
      encoding: "utf8",
    });
    logger.debug(directory);
    return directory;
  }

  async copyDir(sourceDir: string, targetDir: string) {
    return fs.cpSync(sourceDir, targetDir, { recursive: true });
  }

  exists(targetPath: string): boolean {
    logger.debug(`Checking if ${targetPath} exists`);
    const result = fs.existsSync(targetPath);
    logger.debug(`Result: ${result}`);
    return result;
  }

  changeDir(path: string) {
    if (!path) {
      throw new Error(
        `Unable to move to project dir! Directory ${path} does not exist.`,
      );
    }

    logger.debug(`Closing shell and moving to directory at: ${path}`);

    process.chdir(path);

    logger.debug(`Successfully changed current working directory to ${path}`);
  }

  async zipDir(sourceDir: string, outputPath: string) {
    logger.debug(
      `Compressing directory ${sourceDir}. Creating archive at ${outputPath}`,
    );
    if (!fs.existsSync(sourceDir)) {
      throw new Error(
        `Unable to compress directory! Path does not exist: ${sourceDir}`,
      );
    }

    const output = fs.createWriteStream(outputPath);

    const archive = archiver("zip", { zlib: { level: 9 } });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        logger.debug(`ZIP created successfully: ${archive.pointer()} bytes`);
        resolve(true);
      });

      archive.on("error", reject);
      output.on("error", reject);

      archive.pipe(output);
      archive.directory(sourceDir, false);

      archive.finalize().catch(reject);
    });
  }

  removeDir(dirPath: string) {
    logger.debug(`Removing directory at ${dirPath}`);
    fs.rmdirSync(dirPath, { recursive: true });
  }

  writeFile(
    outputPath: string,
    content: string,
    encoding: BufferEncoding = "utf-8",
  ) {
    logger.debug(`Writing file to ${outputPath}`);
    const contentSize = Buffer.byteLength(content, "utf-8");
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    logger.debug(`Size in bytes ${contentSize}`);
    logger.debug(`Encoding: ${encoding}`);
    fs.writeFileSync(outputPath, content, { encoding, mode: 0o666 });
    logger.debug("File written successfully");
  }

  readFile(path: string, silent: boolean = false): string {
    logger.debug(`Opening file at ${path}`);
    try {
      return fs.readFileSync(path, { encoding: "utf-8" });
    } catch (error) {
      if (silent) {
        return "";
      }

      if (isErrorWithMessage(error) && error.message.includes("ENOENT")) {
        logger.error(error.message);
        return "";
      } else {
        throw error;
      }
    }
  }

  getPackageJSON(): null | Record<string, any> {
    try {
      const fileContent = this.readFile("package.json");

      if (!fileContent) {
        return null;
      }

      return JSON.parse(fileContent);
    } catch (error) {
      logger.error("Unable to parse package.json");
      throw new Error(error as any);
    }
  }

  getTsConfig(): null | Record<string, any> {
    try {
      let fileContent = this.readFile("tsconfig.json", true);

      if (!fileContent) {
        return null;
      }

      const commentRegex =
        /((\/\*\*)(\/\*)[\S\s]*?(\*\/))|((\/\/)[\S\s]*?(?=[\n\r]))/g;

      fileContent = fileContent?.replaceAll(commentRegex, "");
      return JSON.parse(fileContent);
    } catch (error) {
      logger.error("Unable to parse tsconfig.json");
      throw new Error(error as any);
    }
  }

  async findBbsCliPath(): Promise<string | null> {
    const command = os.platform() === "win32" ? "where" : "which";

    try {
      const path = await this.runCommand(command, ["bbs"]);
      return path; // Might be multiple lines on Windows, first one is the path
    } catch {
      return null;
    }
  }
  async runCommand(
    command: string,
    args: string[] = [],
    options: SpawnOptions = {},
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      let output = "";
      let errorOutput = "";

      logger.debug({
        command,
        args,
        options,
      });
      try {
        const child = spawn(command, args, { ...options, stdio: "pipe" });

        child.stdout?.on("data", (data) => {
          output += data.toString();
        });

        child.stderr?.on("data", (data) => {
          errorOutput += data.toString();
        });

        child.on("close", (code) => {
          if (code !== 0) {
            reject(
              new Error(
                `Command failed with exit code ${code}: ${command} ${args.join(" ")}\n${errorOutput}`,
              ),
            );
          } else {
            resolve(output.trim());
          }
        });

        child.on("error", (err) => {
          reject(
            new Error(
              `Failed to run command: ${command} ${args.join(" ")}\n${err.message}`,
            ),
          );
        });
      } catch (err) {
        reject(
          new Error(
            `Unexpected error while running command: ${command} ${args.join(" ")}\n${(err as Error).message}`,
          ),
        );
      }
    });
  }

  async checkSubmodulesForUpdate() {
    const logUpdate = (
      name: string,
      currentVersion: string = "none",
      newVersion: string,
    ) =>
      logger.info(
        `New version available for ${name}: ${chalk.redBright(currentVersion)} → ${chalk.greenBright(newVersion)}`,
      );

    const cliPath = this.resolveCLIPath();
    const codegenTemplatesPath = path.resolve(
      cliPath,
      config.scaffolder.templates.path,
    );
    const codegenTemplatesVersion =
      config.scaffolder.templates.versions?.templates;
    const codegenTemplatesName = config.scaffolder.templates.name;

    const codegenTemplates = new Git({
      name: codegenTemplatesName,
      path: codegenTemplatesPath,
      version: codegenTemplatesVersion,
    });

    const newCodegenTemplatesVersion =
      await codegenTemplates.checkForNewVersion();

    if (
      Git.compareVersions(
        newCodegenTemplatesVersion,
        codegenTemplatesVersion || "0.0.0",
      ) === 1
    ) {
      logUpdate(
        codegenTemplatesName,
        codegenTemplatesVersion,
        newCodegenTemplatesVersion,
      );
    }

    // Initialize the submodules for codegen-templates (projects)
    await director.runCommand("git", ["submodule", "update", "--init"], {
      cwd: codegenTemplatesPath,
    });

    const { ts: tsProject, js: jsProject } =
      config.scaffolder.templates.functions.project;

    const functionVersions = config.scaffolder.templates.versions?.functions;

    const tsProjectPath = path.resolve(codegenTemplatesPath, tsProject.path);
    const tsProjectName = tsProject.name;
    const tsProjectVersion = functionVersions?.ts;

    const jsProjectPath = path.resolve(codegenTemplatesPath, jsProject.path);
    const jsProjectName = jsProject.name;
    const jsProjectVersion = functionVersions?.js;

    const tsProjectSubModule = new Git({
      name: tsProjectName,
      path: tsProjectPath,
      version: tsProjectVersion,
    });

    const newTsProjectVersion = await tsProjectSubModule.checkForNewVersion();

    if (Git.compareVersions(newTsProjectVersion, tsProjectVersion)) {
      logUpdate(tsProjectName, tsProjectVersion, newTsProjectVersion);
    }

    const jsProjectSubModule = new Git({
      name: jsProjectName,
      path: jsProjectPath,
      version: config.scaffolder.templates.versions?.functions?.js,
    });

    const newJsProjectVersion = await jsProjectSubModule.checkForNewVersion();

    if (Git.compareVersions(newJsProjectVersion, jsProjectVersion)) {
      logUpdate(jsProjectName, jsProjectVersion, newJsProjectVersion);
    }
  }

  async updateSubmodules() {
    const cliPath = this.resolveCLIPath();
    const codegenTemplatesPath = path.resolve(
      cliPath,
      config.scaffolder.templates.path,
    );
    const codegenTemplateVersion =
      config.scaffolder.templates.versions?.templates;
    const codegenTemplateName = config.scaffolder.templates.name;

    const codegenTemplatesSubModule = new Git({
      name: codegenTemplateName,
      path: codegenTemplatesPath,
      version: codegenTemplateVersion,
    });
    const newCodegenVersion = await codegenTemplatesSubModule.handleUpdate();

    if (newCodegenVersion) {
      if (codegenTemplateVersion !== newCodegenVersion) {
        config.updateConfig({
          scaffolder: {
            templates: { versions: { templates: newCodegenVersion } },
          },
        });
      }
    } else {
      logger.warn(
        `Unable to retrieve a new version for ${codegenTemplateName}!`,
      );
    }

    // Initialize the submodules for codegen-templates (projects)
    await director.runCommand("git", ["submodule", "update", "--init"], {
      cwd: codegenTemplatesPath,
    });

    const { ts: tsProject, js: jsProject } =
      config.scaffolder.templates.functions.project;

    const functionVersions = config.scaffolder.templates.versions?.functions;

    const tsProjectPath = path.resolve(codegenTemplatesPath, tsProject.path);
    const tsProjectName = tsProject.name;
    const tsProjectVersion = functionVersions?.ts;

    const jsProjectPath = path.resolve(codegenTemplatesPath, jsProject.path);
    const jsProjectName = jsProject.name;
    const jsProjectVersion = functionVersions?.js;

    const tsProjectSubModule = new Git({
      name: tsProjectName,
      path: tsProjectPath,
      version: tsProjectVersion,
    });

    const newTsProjectVersion = await tsProjectSubModule.handleUpdate();

    if (newTsProjectVersion) {
      if (newTsProjectVersion !== tsProjectVersion) {
        config.updateConfig({
          scaffolder: {
            templates: {
              versions: {
                functions: {
                  ts: newTsProjectVersion,
                },
              },
            },
          },
        });
      }
    } else {
      logger.warn(
        "The submodule bb-generic-actions-typescript did not yield a version!",
      );
    }

    const jsProjectSubModule = new Git({
      name: jsProjectName,
      path: jsProjectPath,
      version: config.scaffolder.templates.versions?.functions?.js,
    });
    const newJsProjectVersion = await jsProjectSubModule.handleUpdate();

    if (newJsProjectVersion) {
      if (newJsProjectVersion !== jsProjectVersion) {
        config.updateConfig({
          scaffolder: {
            templates: {
              versions: {
                functions: {
                  js: newJsProjectVersion,
                },
              },
            },
          },
        });
      }
    } else {
      logger.warn("The submodule bb-generic-actions did not yield a version!");
    }

    config.saveConfig();
  }
}
