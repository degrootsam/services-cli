import { Command } from "commander";
import { withErrorHandling, deps } from "../../../utils";
import { generateProject } from "../../../utils/scaffolder/functions";
import { generateBbsConfigFile } from "../../../utils/scaffolder";

const initFunction = new Command("init")
  .arguments("<name>")
  .option("--j, --javascript", "Use vanilla JavaScript")
  .description("Initialize a new TypeScript functions project")
  .option(
    "-f, --force",
    "Overwrites project if it already exists. Use with caution!",
  )
  .action(
    withErrorHandling(async (name, options) => {
      await generateProject({ deps, name, javascript: options.javascript });
      generateBbsConfigFile({ deps, targetDir: name });
      deps.director.changeDir(name);
      deps.spinner.start("Installing dependencies...");
      await deps.director.runCommand("bun", ["install"], { stdio: "ignore" });
      deps.spinner.success("Dependencies installed");
      deps.logger.info(
        `Functions project "${name}" created!\n\n  To start developing:\n  - cd ${name}\n  - bbs functions publish\n    `,
      );
    }),
  );

export default initFunction;
