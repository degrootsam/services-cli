import { Command } from "commander";
import {
  withErrorHandling,
  FunctionsScaffolder,
  director,
  spinner,
  logger,
} from "../../../utils";

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
      // bbs functions init <name>
      const functionsScaffolder = new FunctionsScaffolder();
      await functionsScaffolder.generateProject(name, options.javascript);
      director.changeDir(name);
      spinner.start("Installing dependencies...");
      await director.runCommand("npm", ["i"], { stdio: "ignore" });
      spinner.success("Dependencies installed");
      logger.info(
        `Functions project "${name}" created!

  To start developing:
  - cd ${name}
  - bbs functions publish
    `,
      );
    }),
  );

export default initFunction;
