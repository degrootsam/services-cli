import fs from "fs";
import path from "path";
import BaseScaffolder from "..";
import { CONFIG, logger } from "../..";

// Scaffolder for functions projects and individual functions
export default class FunctionsScaffolder extends BaseScaffolder {
  async generateProject(name: string, force: boolean) {
    const templateUrl = CONFIG.scaffolder.links.actions;
    await this.downloadTemplate(templateUrl, name, force);

    logger.info(
      `Functions project "${name}" created!

  To start developing:
  - cd ${name}
  - npm install
  - bbs functions publish
    `,
    );
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
  async generateFunction(name: string) {
    logger.info(`Creating a new function: ${name}`);
    // Implement function generation logic here
  }
}
