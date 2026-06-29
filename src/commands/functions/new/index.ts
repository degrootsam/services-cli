import { Command } from "commander";
import { withErrorHandling, generateFunction, deps } from "../../../utils";

const newFunction = new Command("new")
  .arguments("<name>")
  .description("Initialize a new function")
  .option(
    "-f, --force",
    "Overwrites function if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name) => {
      await generateFunction(deps, name);
    }),
  );

export default newFunction;
