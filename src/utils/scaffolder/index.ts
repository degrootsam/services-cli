import path from "path";
import {
  CONFIG,
  isErrorWithCode,
  isErrorWithMessage,
  logger,
  prompter,
} from "..";
import degit from "degit";

export default class Scaffolder {
  async downloadTemplate(
    url: string,
    location: string,
    force: boolean,
  ): Promise<void> {
    const cloneLocation = path.resolve(process.cwd(), location);
    const downloader = degit(url, { force });
    try {
      await downloader.clone(cloneLocation);
      logger.debug(
        `Downloaded template using degit from ${url} and stored in ${cloneLocation}`,
      );
    } catch (err) {
      logger.error("Error downloading template!");
      if (isErrorWithCode(err)) {
        if (err.code === "DEST_NOT_EMPTY") {
          logger.error(
            "Destination directory is not empty! Provide a different name or use --force to overwrite",
          );
          return;
        }
      }
      logger.error(err);
    }

    return;
  }

  async generateActionsProject(
    name: string = "",
    force: boolean,
  ): Promise<void> {
    const actionTemplateUrl = CONFIG.scaffolder.links.actions;
    await this.downloadTemplate(actionTemplateUrl, name, force);

    logger.info(
      `Project ${name} created!

  To start developing:
  - cd ${name}
  - npm install
  - bbs functions publish
    `,
    );

    return;
  }

  async generateComponentsProject(
    name: string = "",
    force: boolean,
  ): Promise<void> {
    const componentsTemplateUrl = CONFIG.scaffolder.links.actions;
    await this.downloadTemplate(componentsTemplateUrl, name, force);

    logger.info(
      `Project ${name} created!

  To start developing:
  - cd ${name}
  - npm install
  - npm run dev
    `,
    );

    return;
  }
}
