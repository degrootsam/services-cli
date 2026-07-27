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
      let packageJSONContent = await deps.director.getPackageJSON();
      if (!packageJSONContent) {
        throw new Error(
          "Please initialize a functions project first! Use: bbs functions init <project-name>",
        );
      }

      const dependencies = [
        "-d @graphql-codegen/typescript",
        "-d typescript",
        "-d @graphql-codegen/cli",
        "-d @graphql-codegen/typescript-document-nodes",
        "-d @graphql-codegen/introspection",
        "graphql",
      ];

      deps.spinner.start("Installing dependencies...");
      for (let i = 0; i < dependencies.length; i++) {
        try {
          const dependency = dependencies[i].replace("-d ", "");
          // Try to resolve the package
          require.resolve(dependency);
          continue; // Skip installation if the module exists
        } catch (error) {
          // Module is not found, proceed with installation
        }
        const dependency = dependencies[i];
        const command = `bun add ${dependency}`;
        await deps.director.runCommand(command, undefined, { shell: true });
      }
      deps.spinner.success("Dependencies installed");

      // Reload the packageJSON with the new dependencies
      packageJSONContent = await deps.director.getPackageJSON();

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
      await deps.director.writeFile(
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
      await deps.director.runCommand("bun", ["run", "generate-types"]);
      deps.spinner.success("Types generated in generated/graphql.ts");
    }),
  );

export default genTypes;
