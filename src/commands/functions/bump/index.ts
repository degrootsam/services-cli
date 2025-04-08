import { Command } from "commander";
import { withErrorHandling, FunctionsScaffolder } from "../../../utils";

const bumpFunction = new Command("bump")
  .description("Create a new version for a function")
  .action(
    withErrorHandling(async () => {
      const functionsScaffolder = new FunctionsScaffolder();
      await functionsScaffolder.bumpFunction();
    }),
  );

export default bumpFunction;
