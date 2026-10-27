import { Command } from "commander";
import { deps, withErrorHandling } from "../../../utils/index.js";
import {
  formatFunctionList,
  listFunctions,
} from "../../../utils/functions/list.js";

const listFunctionsCmd = new Command("list")
  .description("List your functions with their versions and validation result")
  .option("--json", "Print the list as JSON")
  .action(
    withErrorHandling(async (options) => {
      const functions = await listFunctions({ deps });
      if (options.json) {
        deps.logger.info(JSON.stringify(functions, null, 2));
        return;
      }
      for (const line of formatFunctionList({ deps, functions })) {
        deps.logger.info(line);
      }
    }),
  );

export default listFunctionsCmd;
