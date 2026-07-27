import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import {
  generateFunction,
  generateProject,
} from "../../../utils/scaffolder/functions";
import { generateBbsConfigFile } from "../../../utils/scaffolder";
import { SelectChoice } from "../../../utils/prompter";
import { ProjectTypeKey } from "../../../utils/types";
import path from "path";

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

      await generateProject({
        deps,
        name,
        type: choice as ProjectTypeKey,
      });

      await generateBbsConfigFile({ deps, targetDir: name });

      if (choice !== "wasm") {
        deps.director.changeDir(name);
        deps.spinner.start("Installing dependencies...");
        await deps.director.runCommand("bun", ["install"], {
          stdio: "ignore",
          cwd: path.resolve(name),
        });
        deps.spinner.success("Dependencies installed");
      } else {
        await generateFunction({
          name: "hello-world",
          deps,
          type: "wasm",
        });
      }

      deps.logger.info(
        `Functions project "${name}" created!\n\n  To start developing:\n  - cd ${name}\n  - bbs functions publish\n    `,
      );
    }),
  );

export default initFunction;
