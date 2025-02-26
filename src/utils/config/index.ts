import path from "path";
import { Config } from "../types";
import fs from "fs";
import { Logger } from "winston";
import { logger } from "..";

const DEFAULT_CONFIG: Config = {
  scaffolder: {
    templates: {
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
      gqlCodeGen: "https://github.com/degrootsam/codegen-template",
    },
  },
  options: {
    apiURL: "",
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

const resolveConfig = (): Config => {
  let userConfig = {};

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      userConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    } catch (err) {
      logger.error(
        "Unable to parse config.json! Falling back to default config. Use verbose logging for more information: -v, --verbose",
      );
      logger.debug(err);
    }
  }

  return { ...DEFAULT_CONFIG, ...userConfig };
};

const CONFIG: Config = resolveConfig();

export { CONFIG as default };
