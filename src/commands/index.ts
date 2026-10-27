import { Command } from "commander";
import { deps, withErrorHandling } from "../utils/index.js";
import { getCLIVersion } from "../utils/cli-version.js";
import FusionAuth from "../utils/fusion-auth/index.js";
import { clearAllTokens } from "../utils/keychain/index.js";
import components from "./components/index.js";
import config from "./config/index.js";
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
    .option(
      "--no-input",
      "Never prompt; fail when a value is missing (also on when CI is set)",
    );

  program
    .command("login")
    .description("Log in to the Betty Blocks platform")
    .action(
      withErrorHandling(async () => {
        const fusionAuth = new FusionAuth();
        await fusionAuth.login({ deps });
      }),
    );

  program
    .command("logout")
    .description("Remove all stored login tokens from the Keychain")
    .action(
      withErrorHandling(async () => {
        const cleared = await clearAllTokens({ deps });
        deps.logger.info(
          cleared > 0 ? "Logged out" : "Already logged out, no tokens stored",
        );
      }),
    );

  program.addCommand(update);
  program.addCommand(components);
  program.addCommand(config);
  program.addCommand(functions);

  program.parseAsync();
};

export default runCLI;
