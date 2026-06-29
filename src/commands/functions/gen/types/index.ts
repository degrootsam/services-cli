import { Command } from "commander";
import {
  config,
  withErrorHandling,
  FunctionsScaffolder,
  director,
  prompter,
  spinner,
  createGraphQLAPI,
  deps,
  logger,
} from "../../../../utils";
import { GraphQLAccessToken } from "../../../../utils/gql-api/types";

const genTypes = new Command("types")
  .description("Generate a typescript file based on a Betty Blocks application")
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
      spinner.start("Installing dependencies...");
      for (let i = 0; i < dependencies.length; i++) {
        try {
          const dependency = dependencies[i].replace("-D ", "");
          // Try to resolve the package
          require.resolve(dependency);
          continue; // Skip installation if the module exists
        } catch (error) {
          // Module is not found, proceed with installation
        }
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

      const gqlAPI = createGraphQLAPI(deps);
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

      await functionsScaffolder.generateCodeGenFile(apiURL, tokens.jwtToken!);
      spinner.update("Generating types...");
      spinner.start();
      await director.runCommand("npm", ["run", "generate-types"]);
      spinner.success("Types generated in generated/graphql.ts");
    }),
  );

export default genTypes;
