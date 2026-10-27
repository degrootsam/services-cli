import { Command } from "commander";
import { deps, withErrorHandling } from "../../utils/index.js";
import { formatConfigEntries } from "../../utils/config/sources.js";

const config = new Command("config").description("Inspect the CLI config");

config
  .command("show")
  .description("Show the final config and where each value comes from")
  .option("--json", "Print the config entries as JSON")
  .action(
    withErrorHandling(async (options) => {
      const entries = deps.config.getConfigEntries();
      if (options.json) {
        deps.logger.info(JSON.stringify(entries, null, 2));
        return;
      }
      for (const line of formatConfigEntries(entries)) {
        deps.logger.info(line);
      }
    }),
  );

export default config;
