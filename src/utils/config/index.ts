import path from "path";
import fs from "fs";
import { Config } from "./types";
import { deepMerge, director, logger, prompter } from "..";
import { AgentOptions } from "https";
import { DeepPartial } from "../types";

const DEFAULT_CONFIG: Config = {
  buildOptions: {
    js: undefined,
    ts: undefined,
  },
  scaffolder: {
    cacheDir: ".tmp",
    templates: {
      name: "codegen-templates",
      functions: {
        new: "functions/new",
        test: "functions/test",
        project: {
          ts: {
            name: "bb-generic-actions-typescript",
            path: "functions/projects/ts",
            url: "https://github.com/degrootsam/bb-generic-actions-typescript",
            description: "TypeScript project template",
          },
          js: {
            name: "bb-generic-actions",
            path: "functions/projects/js",
            url: "https://github.com/degrootsam/bb-generic-actions",
            description: "JavaScript project template",
          },
        },
        typegen: "functions/types/index.ts",
      },
      components: {
        new: "components/new",
        project: {
          name: "bb-generic-components",
          path: "templates/components/project",
          url: "https://github.com/degrootsam/component-templates",
        },
      },
      url: "https://github.com/degrootsam/codegen-templates",
      path: "codegen-templates",
    },
    tests: {
      directory: "__tests__",
    },
  },
  app: {
    uuid: "",
    identifier: "",
    zone: "",
  },
  options: {
    appDomain: "betty.app",
    https: true,
    env: "",
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
  private configUpdated: boolean = false;
  private isTypescript: boolean = true;

  public force: boolean = false;

  constructor({ force }: { force?: boolean }) {
    this.config = this.loadConfig();
    const tsConfig = director.getTsConfig();
    this.isTypescript = tsConfig ? true : false;
    this.force = force ?? false;
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

  saveConfig(
    newConfig: DeepPartial<Config> = {},
    full: boolean = false,
    force: boolean = false,
  ): void {
    logger.debug("Saving new config to config.json");
    logger.debug({ newConfig });
    if (this.configUpdated || newConfig || force) {
      this.updateConfig(newConfig);
      const content = full
        ? this.config
        : ({
            app: this.app,
            scaffolder: {
              templates: {
                versions: { ...this.config.scaffolder.templates.versions },
              },
            },
          } as DeepPartial<Config>);
      director.writeFile(CONFIG_PATH, JSON.stringify(content, null, 2));
    }
  }

  updateConfig(newConfig: DeepPartial<Config> = {}): void {
    logger.debug("Storing new config value", newConfig);
    this.config = deepMerge(this.config, newConfig) as Config;
    this.configUpdated = true;
  }

  async getAppUUID() {
    let uuid = this.config.app.uuid;
    if (!uuid) {
      uuid = await prompter.input("Please enter your app UUID");
      this.updateConfig({ app: { ...this.app, uuid } });
    }
    return (
      this.config.app.uuid ??
      (await prompter.input("Please enter your app UUID"))
    );
  }

  async getAppIdentifier() {
    let identifier = this.config.app.identifier;
    if (!identifier) {
      identifier = await prompter.input("Please enter your app identifier");
      this.updateConfig({ app: { ...this.app, identifier } });
    }
    return identifier;
  }

  async getApiURL() {
    const appIdentifier = await this.getAppIdentifier();
    const appUUID = await this.getAppUUID();
    const appDomain = this.config.options.appDomain;
    const protocol = this.httpProtocol;

    return `${protocol}://${appIdentifier}.${appDomain}/api/runtime/${appUUID}`;
  }

  get app() {
    return this.config.app;
  }

  get buildOptions() {
    const buildOption = this.isTypescript
      ? this.config.buildOptions?.ts
      : this.config.buildOptions?.js;

    return buildOption;
  }

  get srcDir() {
    return this.buildOptions?.srcDir || "functions";
  }

  get buildDir() {
    return this.buildOptions?.buildPath || ".tmp";
  }

  get projectExtension() {
    return this.isTypescript ? ".ts" : ".js";
  }

  get scaffolder() {
    return this.config.scaffolder;
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
    return this.config.app.zone;
  }

  get schemaURL() {
    return this.config.options.schemaURL;
  }

  get functionSchemaPath() {
    return this.config.options.functionSchemaPath;
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

  get skipCompile() {
    return this.config.options.skipCompile;
  }
}
