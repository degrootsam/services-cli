import Logger from "./logger/index";
import Prompter from "./prompter";
import path from "path";
import fs from "fs";
import Scaffolder from "./scaffolder";
import GraphQLAPI from "./gql-api";
import { clearToken, getToken, saveToken } from "./keychain";

const opts = process.argv.find((v) => v === "--v" || v === "--verbose");
const logger = new Logger(opts && opts.length > 0);

const prompter = new Prompter();

const DEFAULT_CONFIG = {
  scaffolder: {
    links: {
      actions: "https://github.com/Betty-Blocks-Services/generic-actions",
      components: "https://github.com/Betty-Blocks-Services/generic-components",
      gqlCodeGen:
        "https://github.com/degrootsam/services-cli/blob/master/codegen.template.ts",
    },
  },
};

const CONFIG_PATH = path.resolve(process.cwd(), "config.json");

const resolveConfig = () => {
  const logger = new Logger();
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

const CONFIG = resolveConfig();

function isErrorWithMessage(error: unknown): error is { message: string } {
  return typeof error === "object" && error !== null && "message" in error;
}

function isErrorWithCode(error: unknown): error is { code: string } {
  return typeof error === "object" && error !== null && "code" in error;
}

export {
  // Initialized Classes
  logger,
  prompter,
  // Functions
  clearToken,
  getToken,
  saveToken,
  isErrorWithMessage,
  isErrorWithCode,
  // Constants
  CONFIG,
  // Classess
  Scaffolder,
  GraphQLAPI,
};
