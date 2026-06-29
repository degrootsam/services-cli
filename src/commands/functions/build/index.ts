import { Command } from "commander";
import path from "path";
import {
  deps,
  generateFunctionsBarrelFile,
  getFunctions,
  validateFunctions,
  buildFunctions,
  withErrorHandling,
} from "../../../utils";

const buildFunctionsCmd = new Command("build")
  .description("Build your functions")
  .option("-d, --destination <path>")
  .option("--debug", "Outputs a non minified version for debugging purposes")
  .action(
    withErrorHandling(async (options) => {
      const appDir = path.resolve(deps.config.buildDir, "app");
      const functions = getFunctions(deps);
      const validatedFunctions = await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );

      generateFunctionsBarrelFile(deps, appDir, validatedFunctions, "js");

      await buildFunctions(
        deps,
        deps.config.isTypescript ? "ts" : "js",
        options.destination,
        options.debug,
      );
    }),
  );

export default buildFunctionsCmd;
