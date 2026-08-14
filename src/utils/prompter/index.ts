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
  getURL: (message: string) => Promise<string>;
  select: (
    choices: SelectChoice[],
    message?: string,
    def?: string,
  ) => Promise<string>;
  confirm: (message: string, def?: boolean) => Promise<boolean>;
};

export function createPrompter({ logger }: { logger: LoggerAPI }): PrompterAPI {
  return {
    async input(message, required, validate) {
      const answer = await input({ message, required, validate });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async editor(message, validate) {
      const answer = await editor({ message, validate });
      logger.debug("Answer", answer);
      return answer;
    },

    async getUsername() {
      const answer = await input({
        message: "Please provide your username",
        required: true,
      });
      logger.debug(`Answer '${answer}'`);
      return answer;
    },

    async getPassword() {
      return await password({
        mask: "*",
        message: "Please provide your password",
        validate(value) {
          if (!value) return "Password is required";
          return true;
        },
      });
    },

    async getAuthProfileUUID() {
      const answer = await input({
        message: "Please enter the UUID of the authentication profile",
        required: true,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async getURL(message) {
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

    async select(choices, message, def) {
      const answer = await select({
        message: message ?? "Please make a choice",
        choices,
        loop: true,
        default: def,
      });
      logger.debug(`Answer ${answer}`);
      return answer;
    },

    async confirm(message, def = true) {
      const answer = await confirm({ message, default: def });
      logger.debug(`Answer ${answer}`);
      return answer;
    },
  };
}
