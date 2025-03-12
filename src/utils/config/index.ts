import path from "path";
import fs from "fs";
import { Config } from "../types";
import { deepMerge, director, logger, prompter } from "..";
import { Agent, AgentOptions } from "https";

const DEFAULT_CONFIG: Config = {
  scaffolder: {
    projects: {
      functions: {
        typescript:
          "https://github.com/degrootsam/bb-generic-actions-typescript",
        javascript: "https://github.com/degrootsam/bb-generic-actions",
      },
      components: {
        typescript: "",
        javascript:
          "https://github.com/Betty-Blocks-Services/generic-components",
      },
    },
    codeGeneration: {
      gqlCodeGen: "degrootsam/codegen-templates/gql-codegen",
      newFunction: "https://github.com/degrootsam/gql-codegen/new-function",
      newComponent: "https://github.com/degrootsam/gql-codegen/new-component",
    },
  },
  options: {
    appUUID: "",
    appDomain: "betty.app",
    appIdentifier: "",
    https: true,
    env: "",
    zone: "",
    schemaURL: "https://raw.githubusercontent.com",
    functionSchemaPath:
      "/bettyblocks/json-schema/master/schemas/actions/function.json",
    cacheDir: ".tmp/",
    fusionAuthURL: "https://id{ENVPOSTFIX}.bettyblocks.com",
    builderAPIURL: "api/builder",
    blockstoreAPIURL: "https://my{ENVPOSTFIX}.bettyblocks.com/block-store-api",
    domain: "bettyblocks.com",
    agentOptions: undefined,
    skipCompile: false,
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

export class ConfigManager {
  private config: Config;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    if (fs.existsSync(CONFIG_PATH)) {
      try {
        const userConfig = JSON.parse(director.readFile(CONFIG_PATH) ?? "");
        return deepMerge(DEFAULT_CONFIG, { ...userConfig }) as Config;
      } catch (err) {
        logger.error(
          "Unable to parse config.json! Falling back to default config.",
        );
        logger.debug(err);
      }
    }
    return DEFAULT_CONFIG;
  }

  getConfig(): Config {
    return this.config;
  }

  saveConfig(newConfig: Partial<Config> = {}): void {
    logger.debug("Saving new config to config.json");
    logger.debug({ newConfig });
    this.config = deepMerge(this.config, newConfig) as Config;
    director.writeFile(CONFIG_PATH, JSON.stringify(this.config, null, 2));
  }

  updateConfig(newConfig: Partial<Config> = {}): void {
    logger.debug("Storing new config value", newConfig);
    this.config = deepMerge(this.config, newConfig) as Config;
  }

  async getAppUUID() {
    let appUUID = this.config.options.appUUID;
    if (!appUUID) {
      appUUID = await prompter.input("Please enter your app UUID");
      this.updateConfig({ options: { ...this.options, appUUID } });
    }
    return (
      this.config.options.appUUID ??
      (await prompter.input("Please enter your app UUID"))
    );
  }

  async getAppIdentifier() {
    let appIdentifier = this.config.options.appIdentifier;
    if (!appIdentifier) {
      appIdentifier = await prompter.input("Please enter your app identifier");
      this.updateConfig({ options: { ...this.options, appIdentifier } });
    }
    return appIdentifier;
  }

  async getApiURL() {
    const appIdentifier = await this.getAppIdentifier();
    const appUUID = await this.getAppUUID();
    const appDomain = this.config.options.appDomain;
    const protocol = this.httpProtocol;

    return `${protocol}://${appIdentifier}.${appDomain}/api/runtime/${appUUID}`;
  }

  get options() {
    return this.config.options;
  }

  get httpProtocol() {
    return this.config.options.https ? "https" : "http";
  }

  get env() {
    return this.config.options.env;
  }

  get zone() {
    return this.config.options.zone ?? "production";
  }

  get schemaURL() {
    return this.config.options.schemaURL;
  }

  get functionSchemaPath() {
    return this.config.options.functionSchemaPath;
  }

  get cacheDir() {
    return this.config.options.cacheDir;
  }

  get fusionAuthURL() {
    return this.config.options.fusionAuthURL.replace("{ENVPOSTFIX}", this.env);
  }

  async builderAPIURL() {
    let subdomain = await this.getAppIdentifier();
    subdomain = `${subdomain}.${this.domain}`;

    return `${this.httpProtocol}://${subdomain}/${this.config.options.builderAPIURL}`;
  }

  get blockstoreAPIURL() {
    return this.config.options.blockstoreAPIURL.replace(
      "{ENVPOSTFIX}",
      this.env,
    );
  }

  get domain() {
    return this.config.options.domain;
  }

  get agentOptions() {
    return this.config.options.agentOptions;
  }

  get skipCompile() {
    return this.config.options.skipCompile;
  }
}
