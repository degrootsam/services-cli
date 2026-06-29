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

      const functions = getFunctions(deps);
      const validatedFunctions = await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );
      const validFunctions = getValidFunctions(validatedFunctions);

      generateFunctionsBarrelFile(deps, appDir, validFunctions, "js");

      await buildFunctions(
        deps,
        deps.config.isTypescript ? "ts" : "js",
        undefined,
        true,
      );

      const outputZipPath = path.resolve(deps.config.buildDir, "app.zip");

      await deps.director.zipDir(appDir, outputZipPath);

      deps.director.removeDir(appDir);

      await uploadFunctions(deps, outputZipPath, validFunctions);
    }),
  );

export default publishFunction;
