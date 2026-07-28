import { Command } from "commander";
import path from "path";
import { deps, withErrorHandling } from "../../../utils";
import { buildFunctions } from "../../../utils/functions/build";
import { generateFunctionsBarrelFile } from "../../../utils/functions/gen/barrel";
import { getFunctions, getValidFunctions } from "../../../utils/functions/get";
import { uploadFunctions } from "../../../utils/functions/upload";
import { validateFunctions } from "../../../utils/functions/validate";

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
