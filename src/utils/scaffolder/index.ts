import { cp, rm, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { isErrorWithCode, logger, spinner } from "..";
import degit from "degit";

export default class BaseScaffolder {
  private force: boolean = false;

  constructor(force: boolean = false) {
    this.force = force;
  }

  async copyTemplateFromLocal(
    templatePath: string,
    destinationPath: string,
    force: boolean,
  ): Promise<string | undefined> {
    logger.debug(`Copying template from ${templatePath} to ${destinationPath}`);

    spinner.update(`Copying template from ${path.basename(templatePath)}`);
    spinner.start();

    try {
      const destinationExists = existsSync(destinationPath);

      if (destinationExists) {
        const destinationStats = await stat(destinationPath);
        if (destinationStats.isDirectory() && !force) {
          throw new Error(
            "Destination is not empty! Use --force to overwrite.",
          );
        }

        if (force) {
          logger.debug(`Force enabled — cleaning up ${destinationPath}`);
          await rm(destinationPath, { recursive: true, force: true });
        }
      }

      await cp(templatePath, destinationPath, { recursive: true });

      logger.debug(`Template copied to ${destinationPath}`);
    } catch (err) {
      spinner.stop();
      logger.error("Error copying template!");

      if (isErrorWithCode(err)) {
        if (err.code === "ENOENT") {
          throw new Error(`Template path not found: ${templatePath}`);
        }
      }

      throw new Error(err instanceof Error ? err.message : JSON.stringify(err));
    }

    spinner.success("Template copied successfully");
    return destinationPath;
  }

  async downloadTemplate(
    url: string,
    cloneLocation: string,
    force: boolean,
  ): Promise<string | undefined> {
    logger.debug(`Downloading template at ${url}`);

    const downloader = degit(url, { force });

    spinner.update(`Downloading template at ${url}`);
    spinner.start();

    try {
      await downloader.clone(cloneLocation);
      logger.debug(`Template downloaded and saved at ${cloneLocation}`);
    } catch (err) {
      spinner.stop();
      logger.error("Error downloading template!");
      if (isErrorWithCode(err)) {
        if (err.code === "DEST_NOT_EMPTY") {
          throw new Error(
            "Destination is not empty! Use --force to overwrite.",
          );
        }
        if (err.code === "COULD_NOT_DOWNLOAD") {
          throw new Error(
            "Unable to download template! Try --verbose for more info.",
          );
        }
      }
      throw new Error(JSON.stringify(err));
    }

    spinner.success("Template downloaded successfully");
    return cloneLocation;
  }
}
