import { Command } from "commander";
import { withErrorHandling, FunctionsScaffolder } from "../../../utils";

const newFunction = new Command("new <name>")
  .description("Initialize a new function")
  .action(
    withErrorHandling(async (name) => {
      const functionsScaffolder = new FunctionsScaffolder();
      await functionsScaffolder.generateFunction(name);
    }),
  );

export default newFunction;
