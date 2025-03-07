import { config, logger, prompter } from "..";
import { RequestHandler } from "../request-handler";
import { Config } from "../types";
import { User } from "./types";

export default class FusionAuth {
  private config: Config;

  constructor() {
    this.config = config.getConfig();
  }

  async getFusionAuthURL() {
    let fusionAuthURL = config.fusionAuthURL;

    if (!fusionAuthURL) {
      fusionAuthURL = await prompter.getURL("Please enter the Fusion Auth URL");
    }

    return fusionAuthURL;
  }

  async login() {
    const loginId = await prompter.getUsername();
    const password = await prompter.getPassword();
    const fusionAuthURL = await this.getFusionAuthURL();
    const requestHandler = new RequestHandler(fusionAuthURL);

    const { data, error } = await requestHandler.post<User>("/api/login", {
      loginId,
      password,
    });

    if (error) {
      if (error.status === 404) {
        logger.error("Invalid login credentials! Please try again");
        return await this.login();
      }
    }
  }
}
