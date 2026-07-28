import { Command } from "commander";
import { deps, withErrorHandling } from "../../../utils";
import { bumpFunction } from "../../../utils/functions/bump";

const bumpFunctionCmd = new Command("bump")
  .description("Create a new version for a function")
  .action(
    withErrorHandling(async () => {
      await bumpFunction({ deps });
    }),
  );

export default bumpFunctionCmd;
