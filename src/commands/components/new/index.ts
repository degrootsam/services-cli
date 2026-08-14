import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils/index.js";
import { generateComponent } from "../../../utils/scaffolder/components/index.js";

const newComponent = new Command("new <name>")
  .description("Initialize a new component")
  .action(
    withErrorHandling(async (name) => {
      await generateComponent({ deps, name });
    }),
  );

export default newComponent;
