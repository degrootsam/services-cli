import { Command } from "commander";
import { FunctionsScaffolder, withErrorHandling } from "../../../../utils";

const genTest = new Command("test")
  .option(
    "-f, --force",
    "Overwrites test if it already exists. Use with caution!",
  )
  .description("Generate test files for a selected function")
  .action(
    withErrorHandling(async (options) => {
      const functionsScaffolder = new FunctionsScaffolder();
      await functionsScaffolder.generateTestFiles(undefined, options.force);
    }),
  );
export default genTest;
