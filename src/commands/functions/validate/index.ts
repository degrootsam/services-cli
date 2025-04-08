import { Command } from "commander";
import { withErrorHandling, director, FunctionsUtils } from "../../../utils";

const validateFunctions = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const tsConfig = director.getTsConfig();
      const functionsUtils = new FunctionsUtils();
      const functions = functionsUtils.getFunctions();
      functionsUtils.validateFunctions(functions, tsConfig ? "ts" : "js");
    }),
  );

export default validateFunctions;
