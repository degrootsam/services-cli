import { Command } from "commander";
import path from "path";
import {
  config,
  withErrorHandling,
  director,
  FunctionsUtils,
  FunctionsScaffolder,
} from "../../../utils";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .action(
    withErrorHandling(async () => {
      const tsConfig = director.getTsConfig();
      const appDir = path.resolve(config.buildDir, "app");
      const functionsUtils = new FunctionsUtils();

      const functions = functionsUtils.getFunctions();
      const validatedFunctions =
        await functionsUtils.validateFunctions(functions);
      const validFunctions =
        functionsUtils.getValidFunctions(validatedFunctions);

      const functionsScaffolder = new FunctionsScaffolder();

      functionsScaffolder.generateFunctionsBarrelFile(
        appDir,
        validFunctions,
        "js",
      );

      await functionsUtils.buildFunctions(
        tsConfig ? "ts" : "js",
        undefined,
        true,
      );

      const outputZipPath = path.resolve(config.buildDir, "app.zip");

      await director.zipDir(appDir, outputZipPath);

      director.removeDir(appDir);

      await functionsUtils.uploadFunctions(outputZipPath, validFunctions);
    }),
  );

export default publishFunction;
