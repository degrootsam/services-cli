#!/usr/bin/env node

import { Command } from "commander";
import { execa } from "execa";
import {
  ComponentsScaffolder,
  director,
  FunctionsScaffolder,
  isErrorWithMessage,
  logger,
  prompter,
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
          if (spinner.isSpinning) {
            spinner.fail(error.message);
          } else {
            logger.error(error.message);
          }
        }
      } else {
        if (spinner.isSpinning) {
          spinner.fail("Failed with an error");
        }
        logger.error(error);
      }
    }
    process.exit(1);
  };
};

const runCLI = async () => {
  program
    .name("Betty Blocks Services CLI (Proof of Concept)")
    .version("0.0.1")
    .option("-v, --verbose", "Enable verbose logging");

  const components = program.command("components");

  components
    .command("init <name>")
    .description("Initialize a new components project")
    .option(
      "-f, --force",
      "Overwrites directory if already exists. Use with caution!",
    )
    .action(
      withErrorHandling(async (name, options) => {
        const componentsScaffolder = new ComponentsScaffolder();
        await componentsScaffolder.generateProject(name, options.force);
      }),
    );

  components
    .command("new <name>")
    .description("Initialize a new component")
    .action(
      withErrorHandling(async (name) => {
        const componentsScaffolder = new ComponentsScaffolder();
        await componentsScaffolder.generateComponent(name);
      }),
    );

  const functions = program.command("functions");

  functions
    .command("init <name>")
    .option("--j, --javascript", "Use vanilla JavaScript")
    .description("Initialize a new TypeScript functions project")
    .option(
      "-f, --force",
      "Overwrites directory if already exists. Use with caution!",
    )
    .action(
      withErrorHandling(async (name, options) => {
        // bbs functions init <name>
        const functionsScaffolder = new FunctionsScaffolder();
        await functionsScaffolder.generateProject(
          name,
          options.force,
          options.javascript,
        );
      }),
    );

  functions
    .command("new <name>")
    .description("Initialize a new function")
    .action(
      withErrorHandling(async (name) => {
        const functionsScaffolder = new FunctionsScaffolder();
        await functionsScaffolder.generateFunction(name);
      }),
    );

  functions
    .command("bump")
    .description("Create a new version for a function")
    .action(
      withErrorHandling(async () => {
        const functionsScaffolder = new FunctionsScaffolder();
        await functionsScaffolder.bumpFunction();
      }),
    );

  functions
    .command("gen-types")
    .description(
      "Generate a typescript file based on a Betty Blocks application",
    )
    .action(
      withErrorHandling(async () => {
        const functionsScaffolder = new FunctionsScaffolder();
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
              await functionsScaffolder.generateProject(name, true);

              director.changeDir(name);

            case "npm":
              const createNewDirectory = await prompter.confirm(
                "Do you want to create a new directory?",
              );
              if (createNewDirectory) {
                const newDirectoryName = await prompter.input(
                  "Please enter a name for the direcory",
                  true,
                );
                director.createDir(newDirectoryName);
                director.changeDir(newDirectoryName);
              }
              await execa("npm", ["init"], { stdio: "inherit" });
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
            "Unable to generate types! Unable to get a valid access token. Turn on verbose logging with --verbose for more information",
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
        await functionsScaffolder.generateCodeGenFile(apiURL, tokens.jwtToken!);
        await execa`npm run generate-types`;
        spinner.succeed("Types generated in generated/graphql.ts");
      }),
    );

  program.parseAsync();
};

runCLI();
