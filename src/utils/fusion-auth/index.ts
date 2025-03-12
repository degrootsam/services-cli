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

    const { data, error, responseStatus } =
      await requestHandler.post<AuthToken>("/api/login", {
        loginId,
        password,
      });

    if (error || !data) {
      if (responseStatus === 404) {
        logger.error("Invalid login credentials! Pleasry again");
        return await this.login();
      }
      throw new Error(error?.message ?? "Something went wrong");
    }

    switch (responseStatus) {
      case 200:
        const { token, tokenExpirationInstant } = data;
        return await this.storeToken(token, tokenExpirationInstant);
      case 242:
        const { twoFactorId } = data;
        return await this.handle2FA(twoFactorId);
      default:
        throw new Error(
          `Unhandle response status from Fusion Auth: ${responseStatus}`,
        );
    }
  }

  async handle2FA(twoFactorId: string): Promise<StoredFusionAuthToken> {
    const code = await prompter.input("Please enter your 2FA code", true);
    const request = new RequestHandler(config.fusionAuthURL);

    const { data, error, responseStatus } = await request.post<AuthToken>(
      "/api/two-factor/login",
      {
        code,
        twoFactorId,
      },
    );
    if (responseStatus !== 200) {
      return await this.handle2FA(twoFactorId);
    }

    if (error || !data) {
      throw new Error(error?.message ?? "Unable to verify 2FA response");
    }

    const { token, tokenExpirationInstant } = data;
    return await this.storeToken(token, tokenExpirationInstant);
  }
}
