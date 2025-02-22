import { error } from "console";
import degit from "degit";
import fs from "fs";
import path from "path";
import { CONFIG, isErrorWithCode, logger, spinner } from "..";

export default class Scaffolder {
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
      logger.debug(
        `Downloaded template using degit from ${url} and stored in ${cloneLocation}`,
      );
    } catch (err) {
      spinner.stop();
      logger.error("Error downloading template!");
      if (isErrorWithCode(err)) {
        if (err.code === "DEST_NOT_EMPTY") {
          throw new Error(
            "Destination directory is not empty! Provide a different name or use --force to overwrite",
          );
        }
        if (err.code === "COULD_NOT_DOWNLOAD") {
          logger.debug(err);
          throw new Error(
            "Unable to download codegen file! Use verbose logging with --verbose for more information",
          );
        }
      }
      throw new Error(JSON.stringify(err));
    }

    spinner.succeed("Template downloaded successfully");
    return cloneLocation;
  }

  parseName(name: string) {
    return name.replaceAll(/\s/g, "_").toLowerCase();
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
    const componentsTemplateUrl = CONFIG.scaffolder.links.components;
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

  async generateCodeGenFile(graphqlURL: string, accessToken: string) {
    if (!graphqlURL || !accessToken) {
      logger.error(
        "Unable to generate codegen.ts! Graphql URL or accessToken are empty",
      );
      logger.debug({ graphqlURL, accessToken });
      return;
    }

    const targetDir = process.cwd();
    const tempDir = path.resolve(process.cwd(), "temp");

    logger.debug({ outputDir: targetDir, tempDir });

    const tempOutputDir = await this.downloadTemplate(
      CONFIG.scaffolder.links.gqlCodeGen,
      tempDir,
      true,
    );

    if (!tempOutputDir) {
      return;
    }

    const templateFile = path.join(tempOutputDir, "codegen.template.ts");

    logger.debug(`Opening template file from ${templateFile}`);

    let templateContent = fs.readFileSync(templateFile, "utf-8");

    if (!templateContent) {
      return;
    }

    logger.debug("Replacing template content");

    templateContent = templateContent
      .replace("{{ graphqlURL }}", graphqlURL)
      .replace("{{ accessToken }}", accessToken);

    logger.debug(templateContent);

    const outputPath = path.join(targetDir, "codegen.ts");

    logger.debug(`Writing template file to ${outputPath}`);

    fs.writeFileSync(outputPath, templateContent);

    logger.debug(`Cleaning temp files  at ${tempOutputDir}`);

    fs.rm(tempOutputDir, { recursive: true, force: true }, (err) => {
      if (err) {
        logger.error(err);
      }

      return true;
    });
  }
}
