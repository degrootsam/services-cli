import { config, getToken, logger, prompter, saveToken } from "..";
import { RequestHandler } from "../request-handler";
import { Config } from "../types";
import { AuthToken, StoredFusionAuthToken, User } from "./types";

export default class FusionAuth {
  private token?: StoredFusionAuthToken;

  async getFusionAuthURL() {
    let fusionAuthURL = config.fusionAuthURL;

    if (!fusionAuthURL) {
      fusionAuthURL = await prompter.getURL("Please enter the Fusion Auth URL");
    }

    return fusionAuthURL;
  }

  async storeToken(
    token: string,
    tokenExpirationInstant: number,
  ): Promise<StoredFusionAuthToken> {
    const expiresAtDate = new Date(tokenExpirationInstant);
    const expiresAt = expiresAtDate.setMinutes(expiresAtDate.getMinutes() - 10);

    const fusionAuthToken: StoredFusionAuthToken = {
      token,
      expiresAt,
    };
    await saveToken("fusionAuthToken", JSON.stringify(fusionAuthToken));
    return fusionAuthToken;
  }

  validateToken(token: StoredFusionAuthToken) {
    logger.debug("Validating FusionAuth Access Token");
    let result = false;

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    result = now < expiresAt;
    logger.debug(`Result: ${now} > ${expiresAt} = ${result}`);
    return result;
  }

  async getStoredToken(): Promise<StoredFusionAuthToken | undefined> {
    if (!this.token) {
      const token = await getToken("fusionAuthToken");
      if (token) {
        try {
          this.token = JSON.parse(token);
        } catch (error) {}
      }
    }
    return this.token;
  }

  async getToken(): Promise<StoredFusionAuthToken> {
    logger.debug("Getting stored token for FusionAuth...");
    let token = await this.getStoredToken();

    if (!token) {
      logger.debug("No stored token for FusionAuth available");
      token = await this.login();
    }

    const tokenIsValid = this.validateToken(token);

    if (!tokenIsValid) {
      token = await this.login();
    }

    return this.token!;
  }

  async login(): Promise<StoredFusionAuthToken> {
    const loginId = await prompter.getUsername();
    const password = await prompter.getPassword();
    const fusionAuthURL = await this.getFusionAuthURL();
    const requestHandler = new RequestHandler(fusionAuthURL);

    const response = await requestHandler.post(
      "/api/login",
      JSON.stringify({
        loginId,
        password,
      }),
      {
        "Content-Type": "application/json; charset=UTF-8",
      },
    );

    switch (response.status) {
      case 404:
        logger.error("Invalid login credentials! Please try again");
        return await this.login();
      case 200:
        const { token, tokenExpirationInstant } = (await response.json()) as {
          token: string;
          tokenExpirationInstant: number;
        };
        return await this.storeToken(token, tokenExpirationInstant);
      case 242:
        const { twoFactorId } = (await response.json()) as {
          twoFactorId: string;
        };
        return await this.handle2FA(twoFactorId);
      default:
        throw new Error(
          `Unhandled response status from Fusion Auth: ${response.status} - ${response.statusText}`,
        );
    }
  }

  async handle2FA(twoFactorId: string): Promise<StoredFusionAuthToken> {
    const code = await prompter.input("Please enter your 2FA code", true);
    const request = new RequestHandler(config.fusionAuthURL);

    const response = await request.post("/api/two-factor/login", {
      code,
      twoFactorId,
    });

    if (response.status !== 200) {
      return await this.handle2FA(twoFactorId);
    }

    const result = (await response.json()) as {
      error?: any;
      token: string;
      tokenExpirationInstant: number;
    };

    if (result.error || !result) {
      throw new Error(result.error?.message ?? "Unable to verify 2FA response");
    }

    const { token, tokenExpirationInstant } = result;
    return await this.storeToken(token, tokenExpirationInstant);
  }
}
