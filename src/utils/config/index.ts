import path from "path";
import { Config } from "./types";
import { DeepPartial } from "../types";

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
import type { LoggerAPI } from "../logger";
import type { DirectorAPI } from "../director";
import type { PrompterAPI } from "../prompter";

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

export type ConfigDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
  prompter: PrompterAPI;
};

export type ConfigAPI = {
  force: boolean;
  isTypescript: boolean;
  app: Config["app"];
  buildOptions:
    | NonNullable<Config["buildOptions"]>["ts"]
    | NonNullable<Config["buildOptions"]>["js"];
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
  saveConfig: (
    newConfig?: DeepPartial<Config>,
    full?: boolean,
    force?: boolean,
  ) => void;
  getAppUUID: () => Promise<string>;
  getAppIdentifier: () => Promise<string>;
  getApiURL: () => Promise<string>;
  builderAPIURL: () => Promise<string>;
};

export function createConfig(
  opts: { force?: boolean },
  deps: ConfigDeps,
): ConfigAPI {
  const CONFIG_PATH = path.resolve(process.cwd(), "config.json");
  let _data: Config = loadConfig(deps);
  let _updated = false;
  const _isTs = deps.director.getTsConfig() !== null;
  const _force = opts.force ?? false;

  function loadConfig({ director, logger }: ConfigDeps): Config {
    if (director.exists(CONFIG_PATH)) {
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
    return { ...DEFAULT_CONFIG };
  }

  const api: ConfigAPI = {
    force: _force,
    isTypescript: _isTs,

    get app() {
      return _data.app;
    },
    get buildOptions() {
      return _isTs ? _data.buildOptions?.ts : _data.buildOptions?.js;
    },
    get srcDir() {
      const buildOption = _isTs
        ? _data.buildOptions?.ts
        : _data.buildOptions?.js;
      return buildOption?.srcDir || "functions";
    },
    get buildDir() {
      const buildOption = _isTs
        ? _data.buildOptions?.ts
        : _data.buildOptions?.js;
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
      _updated = true;
    },

    saveConfig(newConfig = {}, full = false, force = false) {
      deps.logger.debug("Saving new config to config.json");
      deps.logger.debug({ newConfig });
      if (_updated || newConfig || force) {
        api.updateConfig(newConfig);
        const content = full
          ? _data
          : ({
              app: _data.app,
              scaffolder: {
                templates: {
                  versions: { ..._data.scaffolder.templates.versions },
                },
              },
            } as DeepPartial<Config>);
        deps.director.writeFile(CONFIG_PATH, JSON.stringify(content, null, 2));
      }
    },

    async getAppUUID() {
      if (!_data.app.uuid) {
        const uuid = await deps.prompter.input("Please enter your app UUID");
        api.updateConfig({ app: { ..._data.app, uuid } });
      }
      return _data.app.uuid;
    },

    async getAppIdentifier() {
      if (!_data.app.identifier) {
        const identifier = await deps.prompter.input(
          "Please enter your app identifier",
        );
        api.updateConfig({ app: { ..._data.app, identifier } });
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
