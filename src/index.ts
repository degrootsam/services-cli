#!/usr/bin/env node

import { Command } from "commander";
import GraphQLAPI from "./utils/gql-api";
import { Scaffolder } from "./utils";
<<<<<<< HEAD
import { GraphQLAccessToken } from "./utils/gql-api/types";
=======
>>>>>>> master

const program = new Command();

const runCLI = async () => {
  program
    .name("Betty Blocks Services CLI (Proof of Concept)")
    .version("0.0.1")
    .option("-v, --verbose", "Enable verbose logging");

  program
    .command("greet <name>")
    .option("-u, --uppercase", "Convert name to uppercase")
    .action((name, options) => {
      const greeting = `Hello, ${options.uppercase ? name.toUpperCase() : name}!`;
      console.log(greeting);
    });

  const components = program.command("components");

  components
    .command("init <name>")
    .option(
      "-f, --force",
      "Overwrites directory if already exists. Use with caution!",
    )
    .action(async (name, options) => {
      const scaffolder = new Scaffolder();
      await scaffolder.generateComponentsProject(name, options.force);
    });

  const functions = program.command("functions");

  functions
    .command("init <name>")
    .option(
      "-f, --force",
      "Overwrites directory if already exists. Use with caution!",
    )
    .action(async (name, options) => {
      // bbs functions init <name>
      const scaffolder = new Scaffolder();
      await scaffolder.generateActionsProject(name, options.force);
    });

  functions
    .command("gen")
    .command("types")
    .action(async () => {
      const gqlAPI = new GraphQLAPI();
      let tokens: GraphQLAccessToken = {
        jwtToken: String(),
        refreshToken: String(),
        accessExpiresAt: Number(),
      };
      const tokensFromKeychain = await gqlAPI.getTokensFromKeychain();
      if (tokensFromKeychain.jwtToken) {
        tokens = {
          ...tokensFromKeychain,
        };
      } else {
        const tokensFromLogin = await gqlAPI.login();
        if (!tokensFromLogin) {
          // Login failed
          return;
        }
        tokens = {
          ...tokensFromLogin,
        };
      }
    });
  program.parseAsync();
};

runCLI();
