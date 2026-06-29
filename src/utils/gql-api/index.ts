import { config, logger, prompter } from "../index";
import {
  GraphQLErrorPayload,
  AuthenticationSuccessPayload,
  GraphQLAccessToken,
  AuthenticationTokenPayload,
  GraphQLResponse,
} from "./types/index";
import { getToken, saveToken } from "../keychain/index";
import { ActionObject, AllowedActionInputTypes } from "../types";

export default class GraphQLAPI {
  private jwtToken: string = "";
  private refreshToken: string = "";
  private accessTokenExpiresAt: number | null = null;

  async getAccessTokens() {
    return await this.getTokensFromKeychain();
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

  private makeQuery(mutation: string, variables: ActionObject) {
    return {
      query: mutation,
      variables: {
        input: {
          ...variables,
        },
      },
    };
  }

  async getTokensFromKeychain(): Promise<GraphQLAccessToken | undefined> {
    logger.debug("Checking tokens in keychain");

    this.jwtToken = (await getToken("gqlAccessToken")) ?? "";
    this.refreshToken = (await getToken("gqlRefreshToken")) ?? "";

    const accessTokenExpiresAt = await getToken("gqlAccessTokenExpiresAt");
    this.accessTokenExpiresAt = accessTokenExpiresAt
      ? Number(accessTokenExpiresAt)
      : null;

    const result = {
      jwtToken: this.jwtToken,
      refreshToken: this.refreshToken,
      accessTokenExpiresAt: this.accessTokenExpiresAt,
    };

    if (this.validateAccessToken()) {
      logger.debug(result);

      return result;
    }

    return;
  }

  validateAccessToken = (): boolean => {
    logger.debug("Validating access tokens");

    if (!this.accessTokenExpiresAt) {
      logger.debug("accessTokenExpiresAt is undefined or null");
      return false;
    }

    const now = new Date();
    const accessTokenExpiresAt = new Date(this.accessTokenExpiresAt);
    const result = accessTokenExpiresAt > now;

    logger.debug(`Access tokens are ${result ? "valid" : "not valid"}`);

    return result;
  };

  private async parseLoginResult(loginResponse: AuthenticationTokenPayload) {
    const { jwtToken, refreshToken, accessExpiresIn } = loginResponse;

    this.jwtToken = jwtToken!;
    this.refreshToken = refreshToken!;

    const currentTime = new Date();
    const accessExpiresAt = currentTime.setTime(
      currentTime.getTime() + ((accessExpiresIn ?? 7200) - 600) * 1000,
    );

    this.accessTokenExpiresAt = accessExpiresAt;

    await saveToken("gqlAccessToken", jwtToken!);
    await saveToken("gqlRefreshToken", refreshToken!);
    await saveToken("gqlAccessTokenExpiresAt", accessExpiresAt.toString());

    return {
      jwtToken,
      refreshToken,
      accessExpiresAt,
    };
  }

  async login(options?: {
    option: "query" | "action";
    apiURL: string;
    authProfileUUID?: string;
  }): Promise<GraphQLAccessToken | void> {
    if (this.validateAccessToken()) {
      logger.debug("Token is still valid, skipping login...");
      return;
    }

    const possibleChoices = [
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
      options?.option ??
      (await prompter.select(
        possibleChoices,
        "You need to login to the GraphQL API. Please choose your preferred method",
      ));

    const parsedAPIURL = options?.apiURL ?? (await config.getApiURL());

    switch (choice) {
      case "query":
        const authProfileUuid =
          options?.authProfileUUID ?? (await prompter.getAuthProfileUUID());
        const username = await prompter.getUsername();
        const password = await prompter.getPassword();
        const loginQuery = this.loginQuery(username, password, authProfileUuid);
        const { data: loginQueryData, error: loginQueryError } =
          await this.request<AuthenticationSuccessPayload>(
            { query: loginQuery },
            parsedAPIURL,
          );

        if (loginQueryError) {
          logger.error(loginQueryError.message);
          if (
            loginQueryError.message ===
            "A valid authentication profile must be provided"
          ) {
            return await this.login({ option: choice, apiURL: parsedAPIURL });
          }
          if (
            loginQueryError.message === "Wrong credentials, please try again"
          ) {
            return await this.login({
              option: choice,
              apiURL: parsedAPIURL,
              authProfileUUID: options?.authProfileUUID,
            });
          }
          return;
        }

        if (!loginQueryData) return;

        return this.parseLoginResult(loginQueryData.login);

      case "action":
        const mutation = await prompter.editor(
          "Copy/Paste the login mutation from the action",
        );
        const input = await prompter.editor(
          "Copy/Paste the input variables from the action",
          (value) => {
            try {
              JSON.parse(value);
              return true;
            } catch (err) {
              return "Please enter valid JSON";
            }
          },
        );

        let parsedInput = JSON.parse(input);
        if (typeof parsedInput !== "object") {
          throw new Error("Please provide a valid JSON object");
        }

        if ("input" in parsedInput && Object.keys(parsedInput).length === 1) {
          parsedInput = parsedInput.input;
        }

        let actionInput: AllowedActionInputTypes = {};
        const keys = Object.keys(parsedInput);

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const valueType = parsedInput[key];
          let v;
          const prompt = `Please enter the value for ${key}`;

          if (valueType === "Object") {
            v = await prompter.editor(prompt, (value) => {
              if (valueType === "Object") {
                try {
                  JSON.parse(value);
                  return true;
                } catch (err) {
                  return "Please enter valid JSON";
                }
              }
              return true;
            });
          } else {
            v = await prompter.input(prompt);
          }
          actionInput[key] = v.trim();
        }

        const query = this.makeQuery(mutation, actionInput);
        if (!parsedAPIURL) throw new Error("Invalid API URL");
        const { data: loginMutationData, error: loginMutationError } =
          await this.request<{
            action: { results: AuthenticationTokenPayload };
          }>(query, parsedAPIURL);

        if (loginMutationError) {
          logger.error(loginMutationError.message);
          if (
            loginMutationError.message ===
            "A valid authentication profile must be provided"
          ) {
            return await this.login({
              option: choice,
              apiURL: parsedAPIURL,
            });
          }
          if (
            loginMutationError.message === "Wrong credentials, please try again"
          ) {
            return await this.login({
              option: choice,
              apiURL: parsedAPIURL,
              authProfileUUID: options?.authProfileUUID,
            });
          }
          return;
        }

        if (!loginMutationData) return;
        console.log({ loginMutationData });
        return await this.parseLoginResult(loginMutationData?.action.results);
    }
  }

  async request<D = any>(
    body: Record<string, any>,
    url: string,
    headers?: Record<string, string>,
  ): Promise<GraphQLResponse<D>> {
    logger.debug(`Preparing POST request to ${url}`);
    logger.debug({ body, headers });
    const apiURL = await config.getApiURL();

    const response = await fetch(apiURL, {
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
        data?: D;
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
