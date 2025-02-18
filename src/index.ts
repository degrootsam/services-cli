#!/usr/bin/env node

import { Command } from "commander";
import { logger } from "./utils";
import GraphQLAPI from "./utils/gql-api";

const program = new Command();

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
    .action(() => {
      const gqlAPI = new GraphQLAPI();
      gqlAPI.getApiURL();
    });

  return program.parseAsync(args);
}

logger.debug("TEST DEBUG");
logger.error("TEST ERROR");

if (require.main === module) {
  runCLI(process.argv);
}
