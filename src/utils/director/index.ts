import fs from "fs-extra";
import path from "path";
import { spawn, SpawnOptions } from "child_process";
import archiver from "archiver";
import os from "os";
import { isErrorWithMessage } from "../errors";
import type { LoggerAPI } from "../logger";

export type DirectorAPI = {
  resolveCLIPath: () => string;
  resolveCLITemplatePath: (templatesPath: string) => string;
  createDir: (name: string) => void;
  readDir: (path: string, recursive?: boolean) => string[];
  copyDir: (sourceDir: string, targetDir: string) => Promise<void>;
  exists: (targetPath: string) => boolean;
  changeDir: (path: string) => void;
  zipDir: (sourceDir: string, outputPath: string) => Promise<void>;
  removeDir: (dirPath: string) => void;
  writeFile: (
    outputPath: string,
    content: string,
    encoding?: BufferEncoding,
  ) => void;
  readFile: (path: string, silent?: boolean) => string;
  getPackageJSON: () => null | Record<string, any>;
  getTsConfig: () => null | Record<string, any>;
  findBbsCliPath: () => Promise<string | null>;
  runCommand: (
    command: string,
    args?: string[],
    options?: SpawnOptions,
  ) => Promise<string>;
};

export function createDirector(
  logger: LoggerAPI,
  dirPath?: string,
): DirectorAPI {
  const resolvedDirPath =
    dirPath ?? (typeof __dirname !== "undefined" ? __dirname : process.cwd());
  return {
    resolveCLIPath() {
      return resolvedDirPath.split("/dist/")[0];
    },

    resolveCLITemplatePath(templatesPath) {
      return path.resolve(this.resolveCLIPath(), templatesPath);
    },

    createDir(name) {
      logger.debug(`Creating directory in ${name}`);
      fs.mkdirSync(name, { recursive: true });
    },

    readDir(dirPath, recursive = false) {
      logger.debug(`Reading directory at ${dirPath}`);
      const directory = fs.readdirSync(dirPath, {
        recursive,
        encoding: "utf8",
      });
      logger.debug(directory);
      return directory;
    },

    async copyDir(sourceDir, targetDir) {
      return fs.cpSync(sourceDir, targetDir, { recursive: true });
    },

    exists(targetPath) {
      logger.debug(`Checking if ${targetPath} exists`);
      const result = fs.existsSync(targetPath);
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

    removeDir(dirPath) {
      logger.debug(`Removing directory at ${dirPath}`);
      fs.rmdirSync(dirPath, { recursive: true });
    },

    writeFile(outputPath, content, encoding = "utf-8") {
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
    },

    readFile(filePath, silent = false) {
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

    getPackageJSON() {
      try {
        const fileContent = this.readFile("package.json");
        if (!fileContent) return null;
        return JSON.parse(fileContent);
      } catch (error) {
        logger.error("Unable to parse package.json");
        throw new Error(error as any);
      }
    },

    getTsConfig() {
      try {
        let fileContent = this.readFile("tsconfig.json", true);
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
  };
}
