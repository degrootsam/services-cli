import { Command } from "commander";
import path from "path";
import {
  config,
  deps,
  director,
  generateFunctionsBarrel,
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
      const tsConfig = director.getTsConfig();

      const appDir = path.resolve(config.buildDir, "app");
      const functions = getFunctions(deps);
      const validatedFunctions = await validateFunctions(deps, functions);

      generateFunctionsBarrel(deps, appDir, validatedFunctions, "js");

      await buildFunctions(
        deps,
        tsConfig ? "ts" : "js",
        options.destination,
        options.debug,
      );
    }),
  );

export default buildFunctionsCmd;
