import path from "path";
import { Config } from "./types/index.js";
import { DeepPartial } from "../types.js";
import type { LoggerAPI } from "../logger/index.js";
import type { DirectorAPI } from "../director/index.js";
import type { PrompterAPI } from "../prompter/index.js";
import type { StateAPI } from "../state/index.js";
import { deepMerge } from "../deep-merge.js";

const DEFAULT_CONFIG: Config = {
  buildOptions: undefined,
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
          wasm: {
            name: "bb-generic-actions-wasm",
            path: "functions/projects/wasm",
            url: "https://github.com/degrootsam/bb-generic-actions-wasm",
            description: "WASM project template",
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

export type BbsUserConfig = {
  app?: Partial<Config["app"]>;
  options?: DeepPartial<Config["options"]>;
  buildOptions?: Config["buildOptions"];
};

export function createConfig(config: BbsUserConfig): BbsUserConfig {
  return config;
}

export type ConfigDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
  prompter: PrompterAPI;
  state: StateAPI;
};

export type ConfigAPI = {
  force: boolean;
  isTypescript: boolean;
  app: Config["app"];
  buildOptions: Config["buildOptions"];
  srcDir: string;
  buildDir: string;
  projectExtension: string;
  scaffolder: Config["scaffolder"];
  options: Config["options"];
  httpProtocol: string;
  env: string;
  zone: string;
  schemaURL: string;
  functionSchemaPath: string;
  fusionAuthURL: string;
  blockstoreAPIURL: string;
  domain: string;
  skipCompile: boolean;
  getConfig: () => Config;
  updateConfig: (newConfig: DeepPartial<Config>) => void;
  loadUserConfig: () => Promise<void>;
  getAppUUID: () => Promise<string>;
  getAppIdentifier: () => Promise<string>;
  getApiURL: () => Promise<string>;
  builderAPIURL: () => Promise<string>;
};

export async function bootstrapConfig({
  opts,
  deps,
}: {
  opts: { force?: boolean };
  deps: ConfigDeps;
}): Promise<ConfigAPI> {
  const LEGACY_CONFIG_PATH = path.resolve(process.cwd(), "config.json");
  const USER_CONFIG_PATH = path.resolve(process.cwd(), "bbs.config.ts");
  const _isTs = (await deps.director.getTsConfig()) !== null;
  const _force = opts.force ?? false;
  let _data: Config = await loadConfig();

  async function loadConfig(): Promise<Config> {
    let merged = deepMerge(
      JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
      deps.state.getState(),
    ) as Config;

    if (await deps.director.exists(LEGACY_CONFIG_PATH)) {
      try {
        const legacyConfig = JSON.parse(
          (await deps.director.readFile(LEGACY_CONFIG_PATH)) ?? "",
        );
        merged = deepMerge(merged, legacyConfig) as Config;
      } catch (err) {
        deps.logger.error(
          "Unable to parse config.json! Skipping legacy config file.",
        );
        deps.logger.debug(err);
      }
    }

    return merged;
  }

  async function importUserConfig(): Promise<BbsUserConfig | undefined> {
    if (!(await deps.director.exists(USER_CONFIG_PATH))) {
      return undefined;
    }

    let mod: any;
    try {
      mod = await import(USER_CONFIG_PATH);
    } catch (err) {
      throw new Error(
        `Failed to load bbs.config.ts: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    if (!mod?.default || typeof mod.default !== "object") {
      throw new Error(
        "bbs.config.ts must have a default export from createConfig(...)",
      );
    }

    return mod.default as BbsUserConfig;
  }

  const api: ConfigAPI = {
    force: _force,
    isTypescript: _isTs,

    get app() {
      return _data.app;
    },
    get buildOptions() {
      return _data.buildOptions;
    },
    get srcDir() {
      const buildOption = _data.buildOptions;
      return buildOption?.srcDir || "functions";
    },
    get buildDir() {
      const buildOption = _data.buildOptions;
      return buildOption?.buildPath || ".tmp";
    },
    get projectExtension() {
      return _isTs ? ".ts" : ".js";
    },
    get scaffolder() {
      return _data.scaffolder;
    },
    get options() {
      return _data.options;
    },
    get httpProtocol() {
      return _data.options.https ? "https" : "http";
    },
    get env() {
      return _data.options.env;
    },
    get zone() {
      return _data.app.zone;
    },
    get schemaURL() {
      return _data.options.schemaURL;
    },
    get functionSchemaPath() {
      return _data.options.functionSchemaPath;
    },
    get fusionAuthURL() {
      return _data.options.fusionAuthURL.replace(
        "{ENVPOSTFIX}",
        _data.options.env,
      );
    },
    get blockstoreAPIURL() {
      return _data.options.blockstoreAPIURL.replace(
        "{ENVPOSTFIX}",
        _data.options.env,
      );
    },
    get domain() {
      return _data.options.domain;
    },
    get skipCompile() {
      return _data.options.skipCompile ?? false;
    },

    getConfig() {
      return _data;
    },

    updateConfig(newConfig = {}) {
      deps.logger.debug("Storing new config value", newConfig);
      _data = deepMerge(_data, newConfig) as Config;
    },

    async loadUserConfig() {
      const userConfig = await importUserConfig();
      if (userConfig) {
        api.updateConfig(userConfig as DeepPartial<Config>);
      }
    },

    async getAppUUID() {
      if (!_data.app.uuid) {
        const uuid = await deps.prompter.input("Please enter your app UUID");
        api.updateConfig({ app: { ..._data.app, uuid } });
        deps.state.updateState({ app: { uuid } });
      }
      return _data.app.uuid;
    },

    async getAppIdentifier() {
      if (!_data.app.identifier) {
        const identifier = await deps.prompter.input(
          "Please enter your app identifier",
        );
        api.updateConfig({ app: { ..._data.app, identifier } });
        deps.state.updateState({ app: { identifier } });
      }
      return _data.app.identifier;
    },

    async getApiURL() {
      const appIdentifier = await api.getAppIdentifier();
      const appUUID = await api.getAppUUID();
      return `${api.httpProtocol}://${appIdentifier}.${_data.options.appDomain}/api/runtime/${appUUID}`;
    },

    async builderAPIURL() {
      let subdomain = await api.getAppIdentifier();
      subdomain = `${subdomain}.${_data.options.domain}`;
      return `${api.httpProtocol}://${subdomain}/${_data.options.builderAPIURL}`;
    },
  };

  return api;
}
