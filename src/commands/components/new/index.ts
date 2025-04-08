import { Command } from "commander";
import { withErrorHandling, ComponentsScaffolder } from "../../../utils";

const newComponent = new Command("new <name>")
  .description("Initialize a new component")
  .action(
    withErrorHandling(async (name) => {
      const componentsScaffolder = new ComponentsScaffolder();
      await componentsScaffolder.generateComponent(name);
    }),
  );

export default newComponent;
