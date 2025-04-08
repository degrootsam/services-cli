import { Command } from "commander";
import path from "path";
import {
  config,
  director,
  FunctionsScaffolder,
  FunctionsUtils,
  withErrorHandling,
} from "../../../utils";

const buildFunctions = new Command("build")
  .description("Build your functions")
  .option("-d, --destination <path>")
  .option("--debug", "Outputs a non minified version for debugging purposes")
  .action(
    withErrorHandling(async (options) => {
      const tsConfig = director.getTsConfig();
      const functionsUtils = new FunctionsUtils();

      const appDir = path.resolve(config.buildDir, "app");
      const functionsScaffolder = new FunctionsScaffolder();
      const functions = functionsUtils.getFunctions();
      const validatedFunctions =
        await functionsUtils.validateFunctions(functions);

      functionsScaffolder.generateFunctionsBarrelFile(
        appDir,
        validatedFunctions,
        "js",
      );
      await functionsUtils.buildFunctions(
        tsConfig ? "ts" : "js",
        options.destination,
        options.debug,
      );
    }),
  );

export default buildFunctions;
