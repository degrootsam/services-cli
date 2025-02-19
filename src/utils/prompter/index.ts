import { input, password } from "@inquirer/prompts";

export default class Prompter {
  async getUsername(): Promise<string> {
    return await input({
      message: "Please provide your username",
      required: true,
    });
  }

  async getPassword(): Promise<string> {
    return await password({ message: "Please provide your password" });
  }

  async getURL(message: string): Promise<string> {
    return await input({
      message: message,
      required: true,
      validate(value: string) {
        const urlMatch = value.match(
          /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/g,
        );

        if (!urlMatch) {
          return "Please provide a valid URL";
        }
        return false;
      },
    });
  }
}
