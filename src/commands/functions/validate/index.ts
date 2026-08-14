import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils/index.js";
import { getFunctions } from "../../../utils/functions/get.js";
import { validateFunctions } from "../../../utils/functions/validate.js";

const validateFunctionsCmd = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const functions = await getFunctions({ deps });
      await validateFunctions({
        deps,
        functions,
        type: deps.config.isTypescript ? "ts" : "js",
      });
    }),
  );

export default validateFunctionsCmd;
