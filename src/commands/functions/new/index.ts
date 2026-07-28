import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { createFunction } from "../../../utils/functions/create";

const newFunction = new Command("new")
  .arguments("<name>")
  .description("Initialize a new function")
  .option(
    "-f, --force",
    "Overwrites function if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name) => {
      await createFunction({ deps, name });
    }),
  );

export default newFunction;
