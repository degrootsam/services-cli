import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { bumpFunction } from "../../../utils/scaffolder/functions";

const bumpFunctionCmd = new Command("bump")
  .description("Create a new version for a function")
  .action(
    withErrorHandling(async () => {
      await bumpFunction({ deps });
    }),
  );

export default bumpFunctionCmd;
