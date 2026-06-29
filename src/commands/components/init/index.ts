import { Command } from "commander";
import {
  withErrorHandling,
  generateComponentsProject,
  deps,
} from "../../../utils";

const initComponent = new Command("init <name>")
  .description("Initialize a new components project")
  .option(
    "-f, --force",
    "Overwrites directory if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      await generateComponentsProject(deps, name, options.force);
    }),
  );

export default initComponent;
