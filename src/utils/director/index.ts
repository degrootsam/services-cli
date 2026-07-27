import fs from "fs-extra";
import path from "path";
import { spawn, SpawnOptions } from "child_process";
import archiver from "archiver";
import os from "os";
import { isErrorWithMessage } from "../errors";
import type { LoggerAPI } from "../logger";
import { ProjectTypeKey } from "../types";
import { generateTest } from "../scaffolder/functions";
import { director } from "..";

export type DirectorAPI = {
  resolveCLIPath: () => string;
  resolveCLITemplatePath: (templatesPath: string) => string;
  createDir: (name: string) => Promise<void>;
  readDir: (path: string, recursive?: boolean) => Promise<string[]>;
  copyDir: (sourceDir: string, targetDir: string) => Promise<void>;
  exists: (targetPath: string) => Promise<boolean>;
  changeDir: (path: string) => void;
  zipDir: (sourceDir: string, outputPath: string) => Promise<void>;
  removeDir: (dirPath: string) => Promise<void>;
  writeFile: (
    outputPath: string,
    content: string,
    encoding?: BufferEncoding,
  ) => Promise<void>;
  readFile: (path: string, silent?: boolean) => Promise<string>;
  readFileSync: (path: string, silent?: boolean) => string;
  getPackageJSON: () => Promise<null | Record<string, any>>;
  getTsConfig: () => Promise<null | Record<string, any>>;
  findBbsCliPath: () => Promise<string | null>;
  runCommand: (
    command: string,
    args?: string[],
    options?: SpawnOptions,
  ) => Promise<string>;
  getProjectType: () => Promise<ProjectTypeKey>;
};

export function createDirector({
  logger,
  dirPath,
}: {
  logger: LoggerAPI;
  dirPath?: string;
}): DirectorAPI {
  const resolvedDirPath =
    dirPath ?? (typeof __dirname !== "undefined" ? __dirname : process.cwd());
  return {
    resolveCLIPath() {
      return resolvedDirPath.split("/dist/")[0];
    },

    resolveCLITemplatePath(templatesPath) {
      return path.resolve(this.resolveCLIPath(), templatesPath);
    },

    async createDir(name): Promise<void> {
      logger.debug(`Creating directory in ${name}`);
      await fs.mkdir(name, { recursive: true });
    },

    async readDir(dirPath, recursive = false) {
      logger.debug(`Reading directory at ${dirPath}`);
      const directory = fs.readdir(dirPath, {
        recursive,
        encoding: "utf8",
      });
      logger.debug(directory);
      return directory;
    },

    async copyDir(sourceDir, targetDir) {
      return fs.cpSync(sourceDir, targetDir, { recursive: true });
    },

    async exists(targetPath) {
      logger.debug(`Checking if ${targetPath} exists`);
      const result = fs.exists(targetPath);
      logger.debug(`Result: ${result}`);
      return result;
    },

    changeDir(dirPath) {
      if (!dirPath) {
        throw new Error(
          `Unable to move to project dir! Directory ${dirPath} does not exist.`,
        );
      }
      logger.debug(`Closing shell and moving to directory at: ${dirPath}`);
      process.chdir(dirPath);
      logger.debug(
        `Successfully changed current working directory to ${dirPath}`,
      );
    },

    async zipDir(sourceDir, outputPath) {
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
          resolve();
        });
        archive.on("error", reject);
        output.on("error", reject);
        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize().catch(reject);
      });
    },

    async removeDir(dirPath): Promise<void> {
      logger.debug(`Removing directory at ${dirPath}`);
      await fs.rm(dirPath, { force: true, recursive: true });
    },

    async writeFile(outputPath, content, encoding = "utf-8"): Promise<void> {
      logger.debug(`Writing file to ${outputPath}`);
      const contentSize = Buffer.byteLength(content, "utf-8");
      const dir = path.dirname(outputPath);
      if (!(await fs.exists(dir))) {
        await fs.mkdir(dir, { recursive: true });
      }
      logger.debug(`Size in bytes ${contentSize}`);
      logger.debug(`Encoding: ${encoding}`);
      await fs.writeFile(outputPath, content, { encoding, mode: 0o666 });
      logger.debug("File written successfully");
    },

    async readFile(filePath, silent = false): Promise<string> {
      logger.debug(`Opening file at ${filePath}`);
      try {
        return await fs.readFile(filePath, { encoding: "utf-8" });
      } catch (error) {
        if (silent) return "";
        if (isErrorWithMessage(error) && error.message.includes("ENOENT")) {
          logger.error(error.message);
          return "";
        }
        throw error;
      }
    },

    readFileSync(filePath, silent) {
      logger.debug(`Opening file at ${filePath}`);
      try {
        return fs.readFileSync(filePath, { encoding: "utf-8" });
      } catch (error) {
        if (silent) return "";
        if (isErrorWithMessage(error) && error.message.includes("ENOENT")) {
          logger.error(error.message);
          return "";
        }
        throw error;
      }
    },

    async getPackageJSON(): Promise<Record<string, any> | null> {
      try {
        const fileContent = await this.readFile("package.json");
        if (!fileContent) return null;
        return JSON.parse(fileContent);
      } catch (error) {
        logger.error("Unable to parse package.json");
        throw new Error(error as any);
      }
    },

    async getTsConfig(): Promise<Record<string, any> | null> {
      try {
        let fileContent = await this.readFile("tsconfig.json", true);
        if (!fileContent) return null;
        const commentRegex =
          /((\/\*\*)(\/\*)[\S\s]*?(\*\/))|((\/\/)[\S\s]*?(?=[\n\r]))/g;
        fileContent = fileContent.replaceAll(commentRegex, "");
        return JSON.parse(fileContent);
      } catch (error) {
        logger.error("Unable to parse tsconfig.json");
        throw new Error(error as any);
      }
    },

    async findBbsCliPath() {
      const command = os.platform() === "win32" ? "where" : "which";
      try {
        return await this.runCommand(command, ["bbs"]);
      } catch {
        return null;
      }
    },

    async runCommand(command, args = [], options = {}) {
      return new Promise((resolve, reject) => {
        let output = "";
        let errorOutput = "";
        logger.debug({ command, args, options });
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
    },
    async getProjectType(): Promise<ProjectTypeKey> {
      const appFunctions = await this.exists(".app-functions");
      const appFunctionsTs = await this.exists(".app-functions-ts");
      const wasmFunctions = await this.exists(".wasm-functions");

      if (appFunctions) return "js";
      if (appFunctionsTs) return "ts";
      if (wasmFunctions) return "wasm";

      throw new Error(
        "Current project is not a valid functions project (js/ts/wasm). Missing file:\n\t-js: .app-functions\n\t-ts:.app-functions-ts\n\t-wasm: .wasm-functions",
      );
    },
  };
}
