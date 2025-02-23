#!/usr/bin/env node

import { Command } from "commander";
import { execa } from "execa";
import {
  director,
  isErrorWithMessage,
  logger,
  prompter,
  scaffolder,
  spinner,
} from "./utils";
import GraphQLAPI from "./utils/gql-api";
import { GraphQLAccessToken } from "./utils/gql-api/types";

const program = new Command();

// Wrapper function to catch errors
const withErrorHandling = (fn: (...args: any[]) => Promise<void>) => {
  return async (...args: any[]) => {
    try {
      await fn(...args);
    } catch (error) {
      logger.debug(error);
      if (isErrorWithMessage(error)) {
        // Prevent logging when user cancels the action
        if (error.message !== "User force closed the prompt with 0 null") {
          logger.error(error.message);
        }
      } else {
        logger.error(error);
      }
      process.exit(1);
    }
  };
};

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
      await scaffolder.generateActionsProject(name, options.force);
    });

  functions
    .command("gen")
    .command("types")
    .action(
      withErrorHandling(async () => {
        let packageJSONContent = director.getPackageJSON();
        if (!packageJSONContent) {
          const choice = (await prompter.select(
            [
              { name: "Initialize functions project", value: "functions" },
              { name: "Initialize empty npm project (npm init)", value: "npm" },
            ],
            "The current working directory has no package.json (required). Please make a choice:",
          )) as "functions" | "npm";

          switch (choice) {
            case "functions":
              const name = await prompter.input(
                "Please provide a name for the project",
                true,
              );
              await scaffolder.generateActionsProject(name, true);

              director.changeDir(name);

            case "npm":
              execa`npm init`;
          }
        }

        if (!packageJSONContent) {
          // Reload package.json
          packageJSONContent = director.getPackageJSON();
          if (!packageJSONContent) {
            throw new Error(
              "Unable to generate types. Cannot load package.json! Please make sure you are inside a functions project",
            );
          }
        }

        const dependencies = [
          "-D @graphql-codegen/typescript",
          "-D typescript",
          "-D @graphql-codegen/cli",
          "-D @graphql-codegen/typescript-document-nodes",
          "-D @graphql-codegen/introspection",
          "graphql",
        ];
        spinner.text = `Installing dependencies (0/${dependencies.length})`;
        spinner.start();
        for (let i = 0; i < dependencies.length; i++) {
          spinner.text = `Installing dependencies (${i + 1}/${dependencies.length})`;
          const dependency = dependencies[i];
          const command = `npm i ${dependency}`;
          await execa(command, { shell: true });
        }
        spinner.succeed("Dependencies installed");

        packageJSONContent = {
          ...packageJSONContent,
          scripts: {
            ...packageJSONContent.scripts,
            "generate-types": "graphql-codegen --config codegen.ts",
          },
        };
        director.writeFile("package.json", JSON.stringify(packageJSONContent));

        const gqlAPI = new GraphQLAPI();
        let tokens: GraphQLAccessToken = {
          jwtToken: String(),
          refreshToken: String(),
          accessExpiresAt: Number(),
        };

        const tokensFromKeychain = await gqlAPI.getTokensFromKeychain();

        if (tokensFromKeychain) {
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

        if (!tokens.jwtToken) {
          logger.error(
            "Unable to generate types! Unable to get a jwt token. Turn on verbose logging with --verbose for more information",
          );
          return;
        }

        const apiURL =
          gqlAPI.getApiURL() ||
          (await prompter.getURL(
            "Please enter the URL to the GraphqQL Playground",
          ));
        spinner.text = "Generating types";
        spinner.start();
        await scaffolder.generateCodeGenFile(apiURL, tokens.jwtToken!);
        await execa`npm run generate-types`;
        spinner.succeed("Types generated in generated/graphql.ts");
        process.exit(0);
      }),
    );

  program.parseAsync();
};

runCLI();
