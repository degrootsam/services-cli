import { exec, spawn } from "child_process";
import os from "os";
import { isErrorWithMessage, logger } from "..";
import fs from "fs";
import path from "path";

export default class Director {
  resolvePath(name: string) {
    // This function always resolves the full path
    return path.resolve(process.cwd(), name.replace(process.cwd(), ""));
  }
  createDir(name: string) {
    const path = this.resolvePath(name);
    logger.debug(`Creating directory in ${path}`);
    fs.mkdirSync(path, { recursive: true });
  }
  writeFile(name: string, content: string, encoding: BufferEncoding = "utf-8") {
    const path = this.resolvePath(name);
    logger.debug(`Writing file to ${path}`);
    const contentSize = Buffer.byteLength(content, "utf-8");
    logger.debug(`Size in bytes ${contentSize}`);
    logger.debug(`Encoding: ${encoding}`);
    fs.writeFileSync(path, content, { encoding, mode: 0o666 });
    logger.debug("File written successfully");
  }

  readFile(name: string): string {
    const path = this.resolvePath(name);
    logger.debug(`Opening file at ${path}`);
    return fs.readFileSync(path, { encoding: "utf-8" });
  }

  changeDir(name: string) {
    const targetDir = path.resolve(process.cwd(), name);
    const targetDirExists = fs.existsSync(targetDir);
    if (!targetDirExists) {
      throw new Error(
        `Unable to move to project dir! Directory ${targetDir} does not exist.`,
      );
    }

    logger.debug(`Closing shell and moving to directory at: ${targetDir}`);

    process.chdir(targetDir);

    logger.debug(
      `Successfully changed current working directory to ${targetDir}`,
    );
  }

  getPackageJSON(dir?: string): null | Record<string, any> {
    let packageJSONContent = null;
    try {
      logger.debug(`Trying to resolve package.json`);
      packageJSONContent = JSON.parse(this.readFile("package.json"));
    } catch (error) {
      // Below is to check whether the file exists or not.
      // If the file does not exist, it will continue
      // If the file does exist but cannot be parsed, it will throw an error
      if (isErrorWithMessage(error)) {
        if (!error.message.includes("ENOENT")) {
          throw new Error(error.message);
        }
      } else {
        throw new Error(error as any);
      }
      logger.debug("No package.json found!");
    }
    return packageJSONContent;
  }
}
