import { input, password } from "@inquirer/prompts";
import { logger, prompter } from "../index.js";
import {
  GraphQLErrorPayload,
  AuthenticationSuccessPayload,
} from "./types/index.js";
import { getToken, saveToken } from "../keychain/index.js";

export default class GraphQLAPI {
  private apiURL = "";
  private accessToken: string = "";
  private refreshToken: string = "";
  private accessTokenExpiresAt: number | null = null;

  private async checkTokensInKeychain() {
    logger.debug("Checking tokens in keychain");
    this.accessToken = (await getToken("gqlAccessToken")) ?? "";
    this.refreshToken = (await getToken("gqlRefreshToken")) ?? "";

    const accessTokenExpiresAt = await getToken("gqlAccessTokenExpiresAt");
    this.accessTokenExpiresAt = accessTokenExpiresAt
      ? Number(accessTokenExpiresAt)
      : null;

    logger.debug({
      accessToken: this.accessToken,
      refreshToken: this.refreshToken,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
    });
  }

  private loginQuery(
    username: string,
    password: string,
    authProfileUuid: string,
  ): string {
    return `
      mutation login {
        login(
          authProfileUuid: "${authProfileUuid}"
          username: "${username}"
          password: "${password}"
        ) {
          jwtToken
          refreshToken
          accessExpiresIn
        }
      }

    `;
  }

  validateAccessToken = (): boolean => {
    if (!this.accessTokenExpiresAt) return false;

    const now = new Date();
    const accessTokenExpiresAt = new Date(this.accessTokenExpiresAt);
    return accessTokenExpiresAt > now;
  };

  async login(
    currentChoice?: string,
    currentAPIURL?: string,
    currentAuthProfileUuid?: string,
  ): Promise<void> {
    await this.checkTokensInKeychain();

    if (this.validateAccessToken()) {
      logger.debug("Token is still valid, skipping login...");
      return;
    }

    const options = [
      {
        name: "Login Query",
        value: "query",
        description:
          "(Default) Uses the standard login query to acccess data from the GraphQL Client",
      },
      {
        name: "Action",
        value: "action",
        description:
          "Uses an action to login to access data from the GraphQL Client. Usefull if you are using custom authentication profiles",
      },
    ];
    const choice =
      currentChoice ?? ((await prompter.select(options)) as "query" | "action");

    const apiURL =
      currentAPIURL ??
      (await prompter.getURL(
        "Please enter the URL to the GraphqQL Playground",
      ));

    this.apiURL = apiURL;

    switch (choice) {
      case "query":
        const authProfileUuid =
          currentAuthProfileUuid ?? (await prompter.getAuthProfileUUID());
        const username = await prompter.getUsername();
        const password = await prompter.getPassword();
        const loginQuery = this.loginQuery(username, password, authProfileUuid);
        const { data, error } =
          await this.request<AuthenticationSuccessPayload>(
            { query: loginQuery },
            apiURL,
          );
        if (error) {
          logger.error(error.message);
          if (
            error.message === "A valid authentication profile must be provided"
          ) {
            return await this.login(choice, apiURL);
          }
          if (error.message === "Wrong credentials, please try again") {
            return await this.login(choice, apiURL, authProfileUuid);
          }
          return;
        }

        if (!data) {
          return;
        }

        this.accessToken = data.login.jwtToken!;
        this.refreshToken = data.login.refreshToken!;
        const currentTime = new Date();
        const accessTokenExpiresAt = currentTime.setTime(
          currentTime.getTime() +
            ((data.login.accessExpiresIn ?? 7200) - 600) * 1000,
        );
        this.accessTokenExpiresAt = accessTokenExpiresAt;

        await saveToken("gqlAccessToken", data.login.jwtToken!);
        await saveToken("gqlRefreshToken", data.login.refreshToken!);
        await saveToken(
          "gqlAccessTokenExpiresAt",
          accessTokenExpiresAt.toString(),
        );

        break;
      case "action":
        break;
    }
  }

  async request<T = any>(
    body: Record<string, any>,
    url: string,
    headers?: Record<string, string>,
  ): Promise<{ data?: T; error?: { message: string } }> {
    logger.debug(`Preparing POST request to ${url}`);
    logger.debug({ body, headers });
    const response = await fetch(this.apiURL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });

    logger.debug({ response });

    if (!response.ok) {
      throw new Error(
        `An error occurred when sending a POST request to: ${url}. Turn on verbose logging for more information with -v or --verbose`,
      );
    }

    try {
      const { data, errors } = (await response.json()) as {
        data?: T;
        errors: GraphQLErrorPayload[];
      };

      logger.debug("Parsed JSON response", { data, errors });

      if (errors && errors.length > 0) {
        for (const err of errors) {
          if (err.extensions?.statusCode === 401) {
            return { error: { message: err.message } };
          }
          logger.error(err.message);
        }

        return {
          error: {
            message: `An error occurred when executing a POST request to: ${url}`,
          },
        };
      }

      return { data };
    } catch (err) {
      logger.error(err);
    }

    return { error: undefined };
  }
}

fetch(
  "https://degrootsam-dev.betty.app/api/runtime/403f375931924b56bc7853a3016088c8",
  {
    headers: {
      accept: "application/json, multipart/mixed",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
      authorization: "Bearer yourtokenhere",
      "cache-control": "no-cache",
      "content-type": "application/json",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua":
        '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      Referer:
        "https://degrootsam-dev.betty.app/api/runtime/403f375931924b56bc7853a3016088c8",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body: '{"query":"mutation login {\\n  login(\\n    authProfileUuid: \\"59a728ee56814c6fae14417826d9e0b4\\"\\n    username: \\"sam.degroot@bettyblocks.com\\"\\n    password: \\"sam.degroot@bettyblocks.com\\"\\n  ) {\\n    jwtToken\\n    refreshToken\\n  }\\n}","operationName":"login"}',
    method: "POST",
  },
);
