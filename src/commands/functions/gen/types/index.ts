import { Command } from "commander";
import {
  withErrorHandling,
  generateCodeGenFile,
  createGraphQLAPI,
  deps,
} from "../../../../utils";
import { generateProject } from "../../../../utils/scaffolder/functions";
import { GraphQLAccessToken } from "../../../../utils/gql-api/types";

const genTypes = new Command("types")
  .description("Generate a typescript file based on a Betty Blocks application")
  .action(
    withErrorHandling(async () => {
      let packageJSONContent = deps.director.getPackageJSON();
      if (!packageJSONContent) {
        const choice = (await deps.prompter.select(
          [
            { name: "Initialize functions project", value: "functions" },
            { name: "Initialize empty npm project (npm init)", value: "npm" },
          ],
          "The current working directory has no package.json (required). Please make a choice:",
        )) as "functions" | "npm";

        switch (choice) {
          case "functions":
            const name = await deps.prompter.input(
              "Please provide a name for the project",
              true,
            );
            await generateProject({ deps, name, javascript: true });

            deps.director.changeDir(name);
            break;
          case "npm":
            const createNewDirectory = await deps.prompter.confirm(
              "Do you want to create a new directory?",
            );
            if (createNewDirectory) {
              const newDirectoryName = await deps.prompter.input(
                "Please enter a name for the direcory",
                true,
              );
              deps.director.createDir(newDirectoryName);
              deps.director.changeDir(newDirectoryName);
            }
            await deps.director.runCommand("npm", ["init"], {
              stdio: "inherit",
            });
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
      deps.spinner.start("Installing dependencies...");
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
        await deps.director.runCommand(command, undefined, { shell: true });
      }
      deps.spinner.success("Dependencies installed");

      // Reload the packageJSON with the new dependencies
      packageJSONContent = deps.director.getPackageJSON();

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
      deps.director.writeFile(
        "package.json",
        JSON.stringify(packageJSONContent),
      );

      const gqlAPI = createGraphQLAPI({ deps });
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
        deps.logger.error(
          "Unable to generate types! Unable to get a valid access token. Turn on verbose logging with --verbose for more information",
        );
        return;
      }

      const apiURL = await deps.config.getApiURL();

      await generateCodeGenFile({
        deps,
        graphqlURL: apiURL,
        accessToken: tokens.jwtToken!,
      });
      deps.spinner.update("Generating types...");
      deps.spinner.start();
      await deps.director.runCommand("npm", ["run", "generate-types"]);
      deps.spinner.success("Types generated in generated/graphql.ts");
    }),
  );

export default genTypes;
