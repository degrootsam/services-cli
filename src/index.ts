#!/usr/bin/env node

import { Command } from "commander";
import { logger } from "./utils";
import GraphQLAPI from "./utils/gql-api";

const program = new Command();

program
  .name("Betty Blocks Services CLI (Proof of Concept)")
  .version("0.0.1")
  .option("-v, --verbose", "Enable verbose logging");

export function runCLI(args: string[]) {
  program
    .command("greet <name>")
    .option("-u, --uppercase", "Convert name to uppercase")
    .action((name, options) => {
      const greeting = `Hello, ${options.uppercase ? name.toUpperCase() : name}!`;
      console.log(greeting);
    });

  program
    .command("functions")
    .command("types")
    .action(async () => {
      const gqlAPI = new GraphQLAPI();
      await gqlAPI.login();
    });

  program.parseAsync(process.argv);

  const globalOpts = program.opts();

  if (globalOpts.verbose) {
    logger.toggleVerbose(true);
  }
}

if (require.main === module) {
  runCLI(process.argv);
}
