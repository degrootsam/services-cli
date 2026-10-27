import { Command } from "commander";
import { deps, withErrorHandling } from "../utils/index.js";
import { getCLIVersion } from "../utils/cli-version.js";
import FusionAuth from "../utils/fusion-auth/index.js";
import components from "./components/index.js";
import functions from "./functions/index.js";
import update from "./update/index.js";

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
    .version(getCLIVersion(deps))
    .option("-v, --verbose", "Enable verbose logging")
    .command("login")
    .action(
      withErrorHandling(async () => {
        const fusionAuth = new FusionAuth();
        await fusionAuth.login({ deps });
      }),
    );

  program.addCommand(update);
  program.addCommand(components);
  program.addCommand(functions);

  program.parseAsync();
};

export default runCLI;
