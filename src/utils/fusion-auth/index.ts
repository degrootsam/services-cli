import { getToken, saveToken } from "../keychain/index.js";
import { RequestHandler } from "../request-handler/index.js";
import { AppDeps } from "../types.js";
import { StoredFusionAuthToken } from "./types/index.js";

export default class FusionAuth {
  private token?: StoredFusionAuthToken;

  async getFusionAuthURL({ deps }: { deps: AppDeps }) {
    let fusionAuthURL = deps.config.fusionAuthURL;

    if (!fusionAuthURL) {
      fusionAuthURL = await deps.prompter.getURL(
        "Please enter the Fusion Auth URL",
      );
    }

    return fusionAuthURL;
  }

  async storeToken({
    token,
    tokenExpirationInstant,
    deps,
  }: {
    token: string;
    tokenExpirationInstant: number;
    deps: AppDeps;
  }): Promise<StoredFusionAuthToken> {
    const expiresAtDate = new Date(tokenExpirationInstant);
    const expiresAt = expiresAtDate.setMinutes(expiresAtDate.getMinutes() - 10);

    const fusionAuthToken: StoredFusionAuthToken = {
      token,
      expiresAt,
    };
    await saveToken({
      account_name: "fusionAuthToken",
      token: JSON.stringify(fusionAuthToken),
      deps,
    });
    this.token = fusionAuthToken;
    return fusionAuthToken;
  }

  validateToken({
    token,
    deps,
  }: {
    token: StoredFusionAuthToken;
    deps: AppDeps;
  }) {
    deps.logger.debug("Validating FusionAuth Access Token");
    let result = false;

    const now = new Date();
    const expiresAt = new Date(token.expiresAt);
    result = now < expiresAt;
    deps.logger.debug(`Result: ${now} > ${expiresAt} = ${result}`);
    return result;
  }

  async getStoredToken({
    deps,
  }: {
    deps: AppDeps;
  }): Promise<StoredFusionAuthToken | undefined> {
    if (!this.token) {
      const token = await getToken({ account_name: "fusionAuthToken", deps });
      if (token) {
        try {
          this.token = JSON.parse(token);
        } catch (error) {
          deps.logger.debug("Unable to parse stored FusionAuth token", error);
        }
      }
    }
    return this.token;
  }

  async getToken({ deps }: { deps: AppDeps }): Promise<StoredFusionAuthToken> {
    const envToken = deps.config.tokens.fusionAuth;
    if (envToken) {
      deps.logger.debug("Using the FusionAuth token from BBS_TOKEN");
      return { token: envToken, expiresAt: Number.MAX_SAFE_INTEGER };
    }

    deps.logger.debug("Getting stored token for FusionAuth...");
    let token = await this.getStoredToken({ deps });

    if (!token) {
      deps.logger.debug("No stored token for FusionAuth available");
      token = await this.login({ deps });
    }

    const tokenIsValid = this.validateToken({ token, deps });

    if (!tokenIsValid) {
      token = await this.login({ deps });
    }

    return token;
  }

  async login({ deps }: { deps: AppDeps }): Promise<StoredFusionAuthToken> {
    const loginId = await deps.prompter.getUsername();
    const password = await deps.prompter.getPassword();
    const fusionAuthURL = await this.getFusionAuthURL({ deps });
    const requestHandler = new RequestHandler(fusionAuthURL);

    const response = await requestHandler.post({
      endpoint: "/api/login",
      body: JSON.stringify({
        loginId,
        password,
      }),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      deps,
    });

    switch (response.status) {
      case 404:
        deps.logger.error("Invalid login credentials! Please try again");
        return await this.login({ deps });
      case 200:
        const { token, tokenExpirationInstant } = (await response.json()) as {
          token: string;
          tokenExpirationInstant: number;
        };
        return await this.storeToken({ token, tokenExpirationInstant, deps });
      case 242:
        const { twoFactorId } = (await response.json()) as {
          twoFactorId: string;
        };
        return await this.handle2FA({ deps, twoFactorId, fusionAuthURL });
      default:
        throw new Error(
          `Unhandled response status from Fusion Auth: ${response.status} - ${response.statusText}`,
        );
    }
  }

  async handle2FA({
    twoFactorId,
    fusionAuthURL,
    deps,
  }: {
    twoFactorId: string;
    fusionAuthURL: string;
    deps: AppDeps;
  }): Promise<StoredFusionAuthToken> {
    const code = await deps.prompter.input("Please enter your 2FA code", true);
    const request = new RequestHandler(fusionAuthURL);

    const response = await request.post({
      endpoint: "/api/two-factor/login",
      body: JSON.stringify({
        code,
        twoFactorId,
      }),
      headers: {
        "Content-Type": "application/json; charset=UTF-8",
      },
      deps,
    });

    if (response.status !== 200) {
      deps.logger.error("Invalid 2FA code! Please try again");
      return await this.handle2FA({ twoFactorId, fusionAuthURL, deps });
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
    return await this.storeToken({ token, tokenExpirationInstant, deps });
  }
}
