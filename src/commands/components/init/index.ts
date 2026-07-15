import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/components";
import { generateBbsConfigFile } from "../../../utils/scaffolder";

const initComponent = new Command("init")
  .arguments("<name>")
  .description("Initialize a new components project")
  .option("-f, --force", "Overwrites project if it already exists.")
  .action(
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, force: options.force ?? false });
      generateBbsConfigFile({ deps, targetDir: name });
    }),
  );

export default initComponent;
