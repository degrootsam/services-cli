import { Command } from "commander";
import { deps, withErrorHandling } from "../../../../utils";
import { generateTypes } from "../../../../utils/functions/gen/types";

const genTypes = new Command("types")
  .description("Generate a typescript file based on a Betty Blocks application")
  .action(
    withErrorHandling(async () => {
      await generateTypes({ deps });
    }),
  );

export default genTypes;
