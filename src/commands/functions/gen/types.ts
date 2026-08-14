import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils/index.js";
import { generateTypes } from "../../../utils/functions/gen/types.js";

const genTypes = new Command("types")
  .description("Generate a typescript file based on a Betty Blocks application")
  .action(
    withErrorHandling(async () => {
      await generateTypes({ deps });
    }),
  );

export default genTypes;
