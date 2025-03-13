#!/usr/bin/env -S node --no-warnings=ExperimentalWarning
import { Command } from "commander";
import {
  BUILDPATH,
  ComponentsScaffolder,
  config,
  director,
  FunctionsScaffolder,
  FunctionsUtils,
  isErrorWithMessage,
  logger,
  prompter,
  spinner,
} from "./utils";
import GraphQLAPI from "./utils/gql-api";
import { GraphQLAccessToken } from "./utils/gql-api/types";
import FusionAuth from "./utils/fusion-auth";
import path from "path";
import { tmpdir } from "os";

const program = new Command();

// Wrapper function to catch errors
const withErrorHandling = (fn: (...args: any[]) => Promise<void>) => {
  return async (...args: any[]) => {
    try {
      await fn(...args);
      config.saveConfig();
    } catch (error) {
      logger.debug(error);
      if (isErrorWithMessage(error)) {
        // Prevent logging when user cancels the action
        if (error.message !== "User force closed the prompt with 0 null") {
          if (spinner.isSpinning()) {
            spinner.error(error.message);
          } else {
            logger.error(error.message);
          }
        }
      } else {
        if (spinner.isSpinning()) {
          spinner.error("Failed with an error");
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
    .option("-v, --verbose", "Enable verbose logging")
    .command("login")
    .action(
      withErrorHandling(async () => {
        const fusionAuth = new FusionAuth();
        await fusionAuth.login();
      }),
    );

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
    .command("validate")
    .description("Validate your functions")
    .action(
      withErrorHandling(async () => {
        const tsConfig = director.getTsConfig();
        const functionsUtils = new FunctionsUtils();
        const functions = functionsUtils.getFunctions();
        functionsUtils.validateFunctions(functions, tsConfig ? "ts" : "js");
      }),
    );

  functions
    .command("build")
    .description("Build your functions")
    .option("-d, --destination <path>")
    .option("--debug", "Outputs a non minified version for debugging purposes")
    .action(
      withErrorHandling(async (options) => {
        const tsConfig = director.getTsConfig();
        const functionsUtils = new FunctionsUtils();

        const appDir = path.resolve(BUILDPATH, "app");
        const functionsScaffolder = new FunctionsScaffolder();
        const functions = functionsUtils.getFunctions();
        const validatedFunctions =
          await functionsUtils.validateFunctions(functions);

        functionsScaffolder.generateFunctionsBarrelFile(
          appDir,
          validatedFunctions,
          "js",
        );

        await functionsUtils.buildFunctions(
          tsConfig ? "ts" : "js",
          options.destination,
          options.debug,
        );
      }),
    );
  functions
    .command("publish")
    .description("Publish your functions")
    .action(
      withErrorHandling(async () => {
        const tsConfig = director.getTsConfig();
        const appDir = path.resolve(BUILDPATH, "app");
        const functionsUtils = new FunctionsUtils();

        const functions = functionsUtils.getFunctions();
        const validatedFunctions =
          await functionsUtils.validateFunctions(functions);
        const validFunctions =
          functionsUtils.getValidFunctions(validatedFunctions);

        const functionsScaffolder = new FunctionsScaffolder();
        functionsScaffolder.generateFunctionsBarrelFile(
          appDir,
          validFunctions,
          "js",
        );

        await functionsUtils.buildFunctions(tsConfig ? "ts" : "js");

        const outputZipPath = path.resolve(BUILDPATH, "app.zip");
        await director.zipDir(appDir, path.resolve(BUILDPATH, "app.zip"));

        await director.zipDir(appDir, outputZipPath);

        director.removeDir(appDir);

        await functionsUtils.uploadFunctions(outputZipPath, validFunctions);
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
              break;
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
              await director.runCommand("npm", ["init"], { stdio: "inherit" });
              break;
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
        spinner.update(`Installing dependencies (0/${dependencies.length})`);
        spinner.loop();
        for (let i = 0; i < dependencies.length; i++) {
          try {
            const dependency = dependencies[i].replace("-D ", "");
            // Try to resolve the package
            require.resolve(dependency);
            spinner.success(`${dependency} is already installed. Skipping.`);
            spinner.start();
            continue; // Skip installation if the module exists
          } catch (error) {
            // Module is not found, proceed with installation
          }
          spinner.update(
            `Installing dependencies (${i + 1}/${dependencies.length})`,
          );
          const dependency = dependencies[i];
          const command = `npm i ${dependency}`;
          await director.runCommand(command, undefined, { shell: true });
        }
        spinner.success("Dependencies installed");

        // Reload the packageJSON with the new dependencies
        packageJSONContent = director.getPackageJSON();
        if (!packageJSONContent) {
          throw new Error(
            "Unable to generate types. Cannot load package.json! Please make sure you are inside a functions project",
          );
        }

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

        const apiURL = await config.getApiURL();

        spinner.update("Generating types...");
        spinner.start();
        await functionsScaffolder.generateCodeGenFile(apiURL, tokens.jwtToken!);
        await director.runCommand("npm", ["run", "generate-types"]);
        spinner.success("Types generated in generated/graphql.ts");
      }),
    );

  program.parseAsync();
};

runCLI();
