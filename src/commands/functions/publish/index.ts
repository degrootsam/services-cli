import { Command } from "commander";
import path from "path";
import {
  deps,
  withErrorHandling,
  getFunctions,
  validateFunctions,
  getValidFunctions,
  generateFunctionsBarrelFile,
  buildFunctions,
  uploadFunctions,
} from "../../../utils";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .action(
    withErrorHandling(async () => {
      const appDir = path.resolve(deps.config.buildDir, "app");

      const functions = await getFunctions({ deps });
      const validatedFunctions = await validateFunctions({
        deps,
        functions,
        type: deps.config.isTypescript ? "ts" : "js",
      });
      const validFunctions = getValidFunctions({
        functions: validatedFunctions,
      });

      generateFunctionsBarrelFile({
        deps,
        outputDir: appDir,
        functions: validFunctions,
        fileType: "js",
      });

      await buildFunctions({
        deps,
        mode: deps.config.isTypescript ? "ts" : "js",
        debug: true,
      });

      const outputZipPath = path.resolve(deps.config.buildDir, "app.zip");
      await deps.director.zipDir(appDir, outputZipPath);

      await deps.director.removeDir(appDir);

      await uploadFunctions({
        deps,
        zipPath: outputZipPath,
        functions: validFunctions,
      });
    }),
  );

export default publishFunction;
