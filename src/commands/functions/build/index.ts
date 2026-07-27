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

      const functions = await getFunctions({ deps });

      const validatedFunctions = await validateFunctions({
        deps,
        functions,
        type: deps.config.isTypescript ? "ts" : "js",
      });

      generateFunctionsBarrelFile({
        deps,
        outputDir: appDir,
        functions: validatedFunctions,
        fileType: "js",
      });

      await buildFunctions({
        deps,
        mode: deps.config.isTypescript ? "ts" : "js",
        outdir: options.destination,
        debug: options.debug,
      });
    }),
  );

export default buildFunctionsCmd;
