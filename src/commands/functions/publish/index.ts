import { Command } from "commander";
import { deps, withErrorHandling } from "../../../utils/index.js";
import { publishFunctions } from "../../../utils/functions/publish.js";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .option(
    "--dry-run",
    "Validate, build and zip without logging in or uploading; keeps the archive",
  )
  .action(
    withErrorHandling(async (options) => {
      await publishFunctions({ deps, dryRun: options.dryRun ?? false });
    }),
  );

export default publishFunction;
