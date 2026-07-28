import { Command } from "commander";
import { generateProject } from "../../../utils/scaffolder/components";
import { withErrorHandling } from "../../../utils";

const initComponent = new Command("init")
  .arguments("<name>")
  .description("Initialize a new components project")
  .option("-f, --force", "Overwrites project if it already exists.")
  .action(
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, force: options.force ?? false });
    }),
  );

export default initComponent;
