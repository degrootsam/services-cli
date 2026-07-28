import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { getFunctions } from "../../../utils/functions/get";
import { validateFunctions } from "../../../utils/functions/validate";

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
