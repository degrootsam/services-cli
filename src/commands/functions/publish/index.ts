import { Command } from "commander";
import { deps, withErrorHandling } from "../../../utils/index.js";
import { publishFunctions } from "../../../utils/functions/publish.js";

const publishFunction = new Command("publish")
  .description("Publish your functions")
  .action(
    withErrorHandling(async () => {
      await publishFunctions({ deps });
    }),
  );

export default publishFunction;
