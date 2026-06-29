import { Command } from "commander";
import path from "path";
import {
  config,
  deps,
  withErrorHandling,
  director,
  getFunctions,
  validateFunctions,
  getValidFunctions,
  generateFunctionsBarrel,
  buildFunctions,
  uploadFunctions,
} from "../../../utils";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .action(
    withErrorHandling(async () => {
      const tsConfig = director.getTsConfig();
      const appDir = path.resolve(config.buildDir, "app");

      const functions = getFunctions(deps);
      const validatedFunctions = await validateFunctions(deps, functions);
      const validFunctions = getValidFunctions(validatedFunctions);

      generateFunctionsBarrel(deps, appDir, validFunctions, "js");

      await buildFunctions(deps, tsConfig ? "ts" : "js", undefined, true);

      const outputZipPath = path.resolve(config.buildDir, "app.zip");

      await director.zipDir(appDir, outputZipPath);

      director.removeDir(appDir);

      await uploadFunctions(deps, outputZipPath, validFunctions);
    }),
  );

export default publishFunction;
