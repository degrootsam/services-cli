import { cp, rm, stat } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import degit from "degit";
import { isErrorWithCode } from "../errors";
import type { AppDeps } from "../types";

export async function copyTemplateFromLocal({
  deps,
  templatePath,
  destinationPath,
  force,
}: {
  deps: AppDeps;
  templatePath: string;
  destinationPath: string;
  force: boolean;
}): Promise<string | undefined> {
  deps.logger.debug(
    `Copying template from ${templatePath} to ${destinationPath}`,
  );
  deps.spinner.update(`Copying template from ${path.basename(templatePath)}`);
  deps.spinner.start();

  try {
    const destinationExists = existsSync(destinationPath);
    if (destinationExists) {
      const destinationStats = await stat(destinationPath);
      if (destinationStats.isDirectory() && !force) {
        throw new Error("Destination is not empty! Use --force to overwrite.");
      }
      if (force) {
        deps.logger.debug(`Force enabled — cleaning up ${destinationPath}`);
        await rm(destinationPath, { recursive: true, force: true });
      }
    }
    await cp(templatePath, destinationPath, { recursive: true });
    deps.logger.debug(`Template copied to ${destinationPath}`);
  } catch (err) {
    deps.spinner.stop();
    deps.logger.error("Error copying template!");
    if (isErrorWithCode(err) && err.code === "ENOENT") {
      throw new Error(`Template path not found: ${templatePath}`);
    }
    throw new Error(err instanceof Error ? err.message : JSON.stringify(err));
  }

  deps.spinner.success("Template copied successfully");
  return destinationPath;
}

export async function downloadTemplate({
  deps,
  url,
  cloneLocation,
  force,
}: {
  deps: AppDeps;
  url: string;
  cloneLocation: string;
  force: boolean;
}): Promise<string | undefined> {
  deps.logger.debug(`Downloading template at ${url}`);
  const downloader = degit(url, { force });
  deps.spinner.update(`Downloading template at ${url}`);
  deps.spinner.start();

  try {
    await downloader.clone(cloneLocation);
    deps.logger.debug(`Template downloaded and saved at ${cloneLocation}`);
  } catch (err) {
    deps.spinner.stop();
    deps.logger.error("Error downloading template!");
    if (isErrorWithCode(err)) {
      if (err.code === "DEST_NOT_EMPTY") {
        throw new Error("Destination is not empty! Use --force to overwrite.");
      }
      if (err.code === "COULD_NOT_DOWNLOAD") {
        throw new Error(
          "Unable to download template! Try --verbose for more info.",
        );
      }
    }
    throw new Error(JSON.stringify(err));
  }

  deps.spinner.success("Template downloaded successfully");
  return cloneLocation;
}

export async function generateBbsConfigFile({
  deps,
  targetDir,
}: {
  deps: AppDeps;
  targetDir: string;
}): Promise<void> {
  const content = `import { createConfig } from "bbs-cli";

export default createConfig({
  app: {
    uuid: "",
    identifier: "",
    zone: "",
  },
});
`;
  const outputPath = path.resolve(targetDir, "bbs.config.ts");
  await deps.director.writeFile(outputPath, content);
}
