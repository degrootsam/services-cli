import { input, password } from "@inquirer/prompts";
import { logger, prompter } from "../index.js";
import {
  GraphQLErrorPayload,
  AuthenticationSuccessPayload,
} from "./types/index.js";

export default class GraphQLAPI {
  private apiURL = "";
  private accessToken: string = "";
  private refreshToken: string = "";

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

  async login() {
    const username = await prompter.getUsername();
    const password = await prompter.getPassword();
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
    const choice = (await prompter.select(options)) as "query" | "action";

    const apiURL = await prompter.getURL(
      "Please enter the URL to the GraphqQL Playground",
    );

    this.apiURL = apiURL;

    switch (choice) {
      case "query":
        const authProfileUuid = await prompter.getAuthProfileUUID();
        const loginQuery = this.loginQuery(username, password, authProfileUuid);
        const { data } = await this.request<AuthenticationSuccessPayload>(
          { query: loginQuery },
          apiURL,
        );
        if (!data) {
          return;
        }

        this.accessToken = data.jwtToken!;
        this.refreshToken = data.refreshToken!;
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
      return {
        error: {
          message: `An error occurred when sending a POST request to: ${url}. Turn on debug logging for more information with --debug`,
        },
      };
    }

    try {
      const { data, errors } = (await response.json()) as {
        data?: T;
        errors: GraphQLErrorPayload[];
      };

      logger.debug("Parsed JSON response", { data, errors });

      if (errors && errors.length > 0) {
        errors.forEach((err) => {
          logger.error(err.message);
        });
        return { error: { message: "Unable to finish command" } };
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
