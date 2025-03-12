import degit from "degit";
import { isErrorWithCode, logger, spinner } from "..";

// Base scaffolder with shared logic
export default class BaseScaffolder {
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
