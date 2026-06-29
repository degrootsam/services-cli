import { Command } from "commander";
import { generateTest, withErrorHandling, deps } from "../../../../utils";

const genTest = new Command("test")
  .option(
    "-f, --force",
    "Overwrites test if it already exists. Use with caution!",
  )
  .description("Generate test files for a selected function")
  .action(
    withErrorHandling(async (options) => {
      await generateTest(deps, undefined, options.force);
    }),
  );
export default genTest;
