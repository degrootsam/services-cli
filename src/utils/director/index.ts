import fs from "fs";
import path from "path";
import { isErrorWithMessage, logger } from "..";
import { spawn, SpawnOptions } from "child_process";

export default class Director {
  resolveCLIPath(): string {
    return __dirname.split("/dist/")[0];
  }

  resolveCLITemplatePath(): string {
    return path.resolve(this.resolveCLIPath(), "templates");
  }

  createDir(name: string) {
    logger.debug(`Creating directory in ${name}`);
    fs.mkdirSync(name, { recursive: true });
  }

  writeFile(path: string, content: string, encoding: BufferEncoding = "utf-8") {
    logger.debug(`Writing file to ${path}`);
    const contentSize = Buffer.byteLength(content, "utf-8");
    logger.debug(`Size in bytes ${contentSize}`);
    logger.debug(`Encoding: ${encoding}`);
    fs.writeFileSync(path, content, { encoding, mode: 0o666 });
    logger.debug("File written successfully");
  }

  readFile(path: string, silent: boolean = false): string | null {
    logger.debug(`Opening file at ${path}`);
    try {
      return fs.readFileSync(path, { encoding: "utf-8" });
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

  readDir(path: string, recursive: boolean = false): string[] {
    logger.debug(`Reading directory at ${path}`);
    const directory = fs.readdirSync(path, {
      recursive,
      encoding: "utf8",
    });
    return directory;
  }

  async copyDir(sourceDir: string, targetDir: string) {
    fs.cpSync(sourceDir, targetDir, { recursive: true });
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

  runCommand(
    command: string,
    args: string[] = [],
    options: SpawnOptions = { stdio: "inherit" },
  ) {
    return new Promise<void>((resolve, reject) => {
      const child = spawn(command, args, options);

      child.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Command failed with exit code ${code}`));
        } else {
          resolve();
        }
      });

      child.on("error", reject);
    });
  }
}
