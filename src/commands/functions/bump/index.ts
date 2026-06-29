import { Command } from "commander";
import { withErrorHandling, bumpFunction, deps } from "../../../utils";

const bumpFunctionCmd = new Command("bump")
  .description("Create a new version for a function")
  .action(
    withErrorHandling(async () => {
      await bumpFunction(deps);
    }),
  );

export default bumpFunctionCmd;
