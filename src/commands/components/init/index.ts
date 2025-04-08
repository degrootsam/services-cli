import { Command } from "commander";
import { withErrorHandling, ComponentsScaffolder } from "../../../utils";

const initComponent = new Command("init <name>")
  .description("Initialize a new components project")
  .option(
    "-f, --force",
    "Overwrites directory if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      const componentsScaffolder = new ComponentsScaffolder();
      await componentsScaffolder.generateProject(name, options.force);
    }),
  );

export default initComponent;
