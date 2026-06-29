import { Command } from "commander";
import { withErrorHandling, generateComponent, deps } from "../../../utils";

const newComponent = new Command("new <name>")
  .description("Initialize a new component")
  .action(
    withErrorHandling(async (name) => {
      await generateComponent(deps, name);
    }),
  );

export default newComponent;
