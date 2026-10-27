import { Command } from "commander";
import path from "path";
import { deps, withErrorHandling } from "../../../utils/index.js";
import { buildFunctions } from "../../../utils/functions/build.js";
import { generateFunctionsBarrelFile } from "../../../utils/functions/gen/barrel.js";
import { getFunctions } from "../../../utils/functions/get.js";
import { validateFunctions } from "../../../utils/functions/validate.js";

const buildFunctionsCmd = new Command("build")
  .description("Build your functions")
  .option("-d, --destination <path>")
  .option("--debug", "Outputs a non minified version for debugging purposes")
  .action(
    withErrorHandling(async (options) => {
      const outdir = options.destination ?? deps.config.buildDir;
      const appDir = path.resolve(outdir, "app");
      const projectType = await deps.director.getProjectType();

      const functions = await getFunctions({ deps, type: projectType });

      const validatedFunctions = await validateFunctions({
        deps,
        functions,
        type: projectType,
      });

      await generateFunctionsBarrelFile({
        deps,
        outputDir: appDir,
        functions: validatedFunctions,
        fileType: "js",
      });

      await buildFunctions({
        deps,
        outdir,
        debug: options.debug,
        type: projectType,
      });
    }),
  );

export default buildFunctionsCmd;
