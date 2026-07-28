import { Command } from "commander";
import path from "path";
import FusionAuth from "../utils/fusion-auth";
import update from "./update";
import components from "./components";
import functions from "./functions";
import { deps, withErrorHandling } from "../utils";

const runCLI = async () => {
  try {
    await deps.config.loadUserConfig();
  } catch (error) {
    deps.logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  const program = new Command();

  program
    .name("Betty Blocks Services CLI (Proof of Concept)")
    .version("0.0.1")
    .option("-v, --verbose", "Enable verbose logging")
    .command("login")
    .action(
      withErrorHandling(async () => {
        const fusionAuth = new FusionAuth();
        await fusionAuth.login();
      }),
    );

  program.addCommand(update);
  program.addCommand(components);
  program.addCommand(functions);

  program.parseAsync();
};

export default runCLI;
