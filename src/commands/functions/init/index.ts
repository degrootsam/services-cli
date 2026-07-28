import { Command } from "commander";
import { deps, withErrorHandling } from "../../../utils";
import { initFunctionsProject } from "../../../utils/functions/init";
import { SelectChoice } from "../../../utils/prompter";
import { ProjectTypeKey } from "../../../utils/types";

const projectTypes: SelectChoice[] = [
  {
    name: "WASM",
    value: "wasm",
  },
  {
    name: "Typescript",
    value: "ts",
  },
  {
    name: "Javascript",
    value: "js",
  },
];

const initFunction = new Command("init")
  .arguments("<name>")
  .description("Initialize a new functions project")
  .option(
    "-f, --force",
    "Overwrites project if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      const choice = await deps.prompter.select(
        projectTypes,
        `What kind of functions project should ${name} be?`,
      );

      if (!choice) throw new Error("Please make a choice!");

      await initFunctionsProject({
        deps,
        name,
        type: choice as ProjectTypeKey,
      });

      deps.logger.info(
        `Functions project "${name}" created!\n\n  To start developing:\n  - cd ${name}\n  - bbs functions publish\n    `,
      );
    }),
  );

export default initFunction;
