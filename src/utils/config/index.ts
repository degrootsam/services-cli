import path from "path";
import fs from "fs";
import { Config } from "../types";
import { deepMerge, director, logger } from "..";

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
      gqlCodeGen: "https://github.com/degrootsam/gql-codegen/codegen-template",
      newFunction: "https://github.com/degrootsam/gql-codegen/new-function",
      newComponent: "https://github.com/degrootsam/gql-codegen/new-component",
    },
  },
  options: {
    apiURL: "",
    env: "",
    zone: "",
    schemaURL: "https://raw.githubusercontent.com",
    functionSchemaPath:
      "/bettyblocks/json-schema/master/schemas/actions/function.json",
    cacheDir: ".tmp/",
    fusionAuthURL: "https://id{ENVPOSTFIX}.bettyblocks.com",
    builderAPIURL: "/api/builder",
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

  get options() {
    return this.config.options;
  }

  get apiURL() {
    return this.config.options.apiURL;
  }

  get env() {
    return this.config.options.env;
  }

  get zone() {
    return this.config.options.zone;
  }

  set zone(zone: string) {
    this.config.options.zone = zone;
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

  get builderAPIURL() {
    return this.config.options.builderAPIURL;
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
