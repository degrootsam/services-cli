import { Command } from "commander";
import { withErrorHandling, deps } from "../../../../utils";
import { generateTest } from "../../../../utils/functions/gen/test";

const genTest = new Command("test")
  .option(
    "-f, --force",
    "Overwrites test if it already exists. Use with caution!",
  )
  .description("Generate test files for a selected function")
  .action(
    withErrorHandling(async (options) => {
      await generateTest({ deps, force: options.force });
    }),
  );
export default genTest;
