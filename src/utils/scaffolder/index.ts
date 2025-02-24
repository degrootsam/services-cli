import degit from "degit";
import path from "path";
import { isErrorWithCode, logger, spinner } from "..";

// Base scaffolder with shared logic
export default class BaseScaffolder {
  async downloadTemplate(
    url: string,
    location: string,
    force: boolean,
  ): Promise<string | undefined> {
    const cloneLocation = path.resolve(process.cwd(), location);
    const downloader = degit(url, { force });

    spinner.text = "Downloading template";
    spinner.start();

    try {
      await downloader.clone(cloneLocation);
      logger.debug(`Downloaded template from ${url} to ${cloneLocation}`);
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

    spinner.succeed("Template downloaded successfully");
    return cloneLocation;
  }

  parseName(name: string) {
    return name.replace(/\s/g, "_").toLowerCase();
  }
}
