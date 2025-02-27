import chalk from "chalk";
import fs from "fs";
import path from "path";
import { isErrorWithMessage, logger } from "..";
import { Functions } from "../types";

export default class Director {
  resolvePath(name: string) {
    // This function always resolves the full path
    return path.resolve(
      process.cwd(),
      ...name.replace(process.cwd(), "").split("/"),
    );
  }

  resolveCLIPath(): string {
    return __dirname.split("/dist/")[0];
  }

  resolveCLITemplatePath(): string {
    return path.resolve(this.resolveCLIPath(), "templates");
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

  readFile(
    name: string,
    resolvePath: boolean = false,
    silent: boolean = false,
  ): string | null {
    let resolvedPath = name;
    if (resolvePath) {
      resolvedPath = this.resolvePath(name);
    }
    logger.debug(`Opening file at ${resolvedPath}`);
    try {
      return fs.readFileSync(resolvedPath, { encoding: "utf-8" });
    } catch (error) {
      if (silent) {
        return null;
      }

      if (isErrorWithMessage(error) && error.message.includes("ENOENT")) {
        logger.error(error.message);
        return null;
      } else {
        throw new Error(error as any);
      }
    }
  }

  readDir(name: string, recursive: boolean = false): string[] {
    const resolvedPath = this.resolvePath(name);
    logger.debug(`Reading directory at ${resolvedPath}`);
    const directory = fs.readdirSync(resolvedPath, {
      recursive,
      encoding: "utf8",
    });
    return directory;
  }

  async copyDir(
    sourceDir: string,
    targetDir: string,
    resolveSource: boolean = false,
    resolveTarget: boolean = true,
  ) {
    let resolvedSourceDir = sourceDir;
    let resolvedTargetDir = targetDir;

    if (resolveSource) {
      resolvedSourceDir = this.resolvePath(resolvedSourceDir);
    }

    if (resolveTarget) {
      resolvedTargetDir = this.resolvePath(resolvedTargetDir);
    }

    fs.cpSync(resolvedSourceDir, resolvedTargetDir, { recursive: true });
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
      let fileContent = this.readFile("tsconfig.json", true, true);

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
}
