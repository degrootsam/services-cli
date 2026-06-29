import { Command } from "commander";
import { withErrorHandling, FunctionsScaffolder } from "../../../utils";

const newFunction = new Command("new")
  .arguments("<name>")
  .description("Initialize a new function")
  .option(
    "-f, --force",
    "Overwrites function if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      const functionsScaffolder = new FunctionsScaffolder();
      await functionsScaffolder.generateFunction(name);
    }),
  );

export default newFunction;
