import { confirm, editor, input, password, select } from "@inquirer/prompts";
import type { LoggerAPI } from "../logger/index.js";

export type SelectChoice = {
  description?: string;
  value: string;
  name: string;
  short?: string;
  separator?: string;
  disabled?: string;
};

export type PrompterAPI = {
  input: (
    message: string,
    required?: boolean,
    validate?: (value: string) => boolean | string,
  ) => Promise<string>;
  editor: (
    message: string,
    validate?: (value: string) => boolean | string,
  ) => Promise<string>;
  getUsername: () => Promise<string>;
  getPassword: () => Promise<string>;
  getAuthProfileUUID: () => Promise<string>;
  getAuthorizationToken: () => Promise<string>;
  getURL: (message: string) => Promise<string>;
  select: (
    choices: SelectChoice[],
    message?: string,
    def?: string,
  ) => Promise<string>;
  confirm: (message: string, def?: boolean) => Promise<boolean>;
};

// Thrown instead of prompting when prompts are disabled
function promptsDisabled(message: string): Error {
  return new Error(
    `Cannot ask "${message}": prompts are disabled (--no-input or CI). Provide the value up front, see "Non-interactive use" in the readme.`,
  );
}

export function createPrompter({
  logger,
  interactive = true,
}: {
  logger: LoggerAPI;
  interactive?: boolean;
}): PrompterAPI {
  return {
    async input(message, required, validate) {
      if (!interactive) throw promptsDisabled(message);
      const answer = await input({ message, required, validate });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async editor(message, validate) {
      if (!interactive) throw promptsDisabled(message);
      const answer = await editor({ message, validate });
      logger.debug("Answer", answer);
      return answer;
    },

    async getUsername() {
      const message = "Please provide your username";
      if (!interactive) throw promptsDisabled(message);
      const answer = await input({
        message,
        required: true,
      });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async getPassword() {
      const message = "Please provide your password";
      if (!interactive) throw promptsDisabled(message);
      return await password({
        mask: "*",
        message,
        validate(value) {
          if (!value) return "Password is required";
          return true;
        },
      });
    },

    async getAuthProfileUUID() {
      const message = "Please enter the UUID of the authentication profile";
      if (!interactive) throw promptsDisabled(message);
      const answer = await input({
        message,
        required: true,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async getAuthorizationToken() {
      const message = "Please paste your authorization token";
      if (!interactive) throw promptsDisabled(message);
      return await password({
        mask: "*",
        message,
        validate(value) {
          if (!value.trim()) return "Authorization token is required";
          return true;
        },
      });
    },

    async getURL(message) {
      if (!interactive) throw promptsDisabled(message);
      const answer = await input({
        message,
        required: true,
        validate(value) {
          const urlMatch = value.match(
            /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/g,
          );
          if (urlMatch && urlMatch.length > 0) return true;
          return "Please provide a valid URL";
        },
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async select(choices, message = "Please make a choice", def) {
      if (!interactive) {
        if (def === undefined) throw promptsDisabled(message);
        return def;
      }
      const answer = await select({
        message,
        choices,
        loop: true,
        default: def,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async confirm(message, def = true) {
      if (!interactive) return def;
      const answer = await confirm({ message, default: def });
      logger.debug(`Answer ${answer}`);
      return answer;
    },
  };
}
