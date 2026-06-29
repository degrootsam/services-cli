import { Command } from "commander";
import {
  withErrorHandling,
  director,
  getFunctions,
  validateFunctions,
  deps,
} from "../../../utils";

const validateFunctionsCmd = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const tsConfig = director.getTsConfig();
      const functions = getFunctions(deps);
      await validateFunctions(deps, functions, tsConfig ? "ts" : "js");
    }),
  );

export default validateFunctionsCmd;
