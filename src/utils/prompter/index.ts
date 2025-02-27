import { confirm, editor, input, password, select } from "@inquirer/prompts";
import { Separator } from "@inquirer/core";
import { logger } from "..";

export default class Prompter {
  async input(
    message: string,
    required?: boolean,
    validate?: (value: string) => boolean | string,
  ): Promise<string> {
    const answer = await input({
      message,
      required,
      validate,
    });
    logger.debug(`Answer '${answer}'`);
    return answer;
  }
  async editor(
    message: string,
    validate?: (value: string) => boolean | string,
  ): Promise<string> {
    const answer = editor({
      message,
      validate,
    });
    logger.debug("Answer", answer);

    return answer;
  }
  async getUsername(): Promise<string> {
    const answer = await input({
      message: "Please provide your username",
      required: true,
    });
    logger.debug(`Answer '${answer}'`);
    return answer;
  }

  async getPassword(): Promise<string> {
    return await password({
      mask: "*",
      message: "Please provide your password",
      validate(value) {
        if (!value) {
          return "Password is required";
        }
        return true;
      },
    });
  }

  async getAuthProfileUUID(): Promise<string> {
    const answer = await input({
      message: "Please enter the UUID of the authentication profile",
      required: true,
    });

    logger.debug(`Answer ${answer}`);

    return answer;
  }

  async getURL(message: string): Promise<string> {
    const answer = await input({
      message: message,
      required: true,
      validate(value: string) {
        const urlMatch = value.match(
          /^[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?$/g,
        );

        if (urlMatch && urlMatch.length > 0) {
          return true;
        }

        return "Please provide a valid URL";
      },
    });

    logger.debug(`Answer ${answer}`);

    return answer;
  }

  async select(
    choices: {
      description?: string;
      value: string;
      name: string;
      short?: string;
      separator?: string;
      disabled?: string;
    }[],
    message?: string,
    def?: string,
  ): Promise<string> {
    const answer = await select({
      message: message ?? "Please make a choice",
      choices,
      loop: true,
      default: def,
    });

    logger.debug(`Answer ${answer}`);

    return answer;
  }

  async confirm(message: string, def: boolean = true) {
    const answer = await confirm({
      message,
      default: def,
    });

    logger.debug(`Answer ${answer}`);

    return answer;
  }
}
