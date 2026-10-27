import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils/index.js";
import { getFunctions } from "../../../utils/functions/get.js";
import { validateFunctions } from "../../../utils/functions/validate.js";

const validateFunctionsCmd = new Command("validate")
  .description("Validate your functions")
  .action(
    withErrorHandling(async () => {
      const projectType = await deps.director.getProjectType();
      const functions = await getFunctions({ deps, type: projectType });
      await validateFunctions({ deps, functions, type: projectType });
    }),
  );

export default validateFunctionsCmd;
