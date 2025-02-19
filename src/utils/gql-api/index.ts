import { input, password } from "@inquirer/prompts";
import { logger } from "../index.js";

export default class GraphQLAPI {
  private apiURL = "";
  private accessToken: string = "";
  private refreshToken: string = "";

  async getApiURL(): Promise<string> {
    return await input({
      message: "Please enter the URL of the GraphQL Runtime API",
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

  async request() {
    logger.debug("This is a test!");
  }
}
