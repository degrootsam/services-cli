import { Command } from "commander";
import {
  withErrorHandling,
  getFunctions,
  validateFunctions,
  deps,
} from "../../../utils";

const validateFunctionsCmd = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const functions = getFunctions(deps);
      await validateFunctions(
        deps,
        functions,
        deps.config.isTypescript ? "ts" : "js",
      );
    }),
  );

export default validateFunctionsCmd;
