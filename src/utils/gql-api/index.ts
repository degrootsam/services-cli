import { input, password } from "@inquirer/prompts";
import { logger, prompter } from "../index.js";

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

    let authProfileUuid = apiURL.match(
      /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/g,
    );

    switch (choice) {
      case "query":
        break;
      case "action":
        break;
    }
  }

  async request() {
    logger.debug("This is a test!");
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
