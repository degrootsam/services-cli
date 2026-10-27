import type { AppDeps } from "../types.js";
import {
  GraphQLErrorPayload,
  AuthenticationSuccessPayload,
  GraphQLAccessToken,
  AuthenticationTokenPayload,
  GraphQLResponse,
} from "./types/index.js";
import { getToken, saveToken } from "../keychain/index.js";
import { promptActionLoginQuery } from "./action-login.js";
import { getJWTExpiresIn } from "./jwt.js";
import { loginQuery } from "./queries.js";

export type GqlAPI = {
  getAccessTokens: () => Promise<GraphQLAccessToken | undefined>;
  getTokensFromKeychain: () => Promise<GraphQLAccessToken | undefined>;
  validateAccessToken: () => boolean;
  login: (options?: {
    option?: string;
    apiURL?: string;
    authProfileUUID?: string;
  }) => Promise<GraphQLAccessToken | undefined>;
  request: <D = any>(
    body: Record<string, any>,
    url: string,
    headers?: Record<string, string>,
  ) => Promise<GraphQLResponse<D>>;
};

export function createGraphQLAPI({ deps }: { deps: AppDeps }): GqlAPI {
  const { config, logger, prompter } = deps;

  let _jwt = "";
  let _refresh = "";
  let _expiresAt: number | null = null;

  async function parseLoginResult(loginResponse: AuthenticationTokenPayload) {
    const { jwtToken, refreshToken, accessExpiresIn } = loginResponse;

    _jwt = jwtToken!;
    _refresh = refreshToken!;

    const currentTime = new Date();
    const accessExpiresAt = currentTime.setTime(
      currentTime.getTime() + ((accessExpiresIn ?? 7200) - 600) * 1000,
    );

    _expiresAt = accessExpiresAt;

    await saveToken({ account_name: "gqlAccessToken", token: jwtToken!, deps });
    if (refreshToken) {
      await saveToken({
        account_name: "gqlRefreshToken",
        token: refreshToken,
        deps,
      });
    }
    await saveToken({
      account_name: "gqlAccessTokenExpiresAt",
      token: accessExpiresAt.toString(),
      deps,
    });

    return {
      jwtToken,
      refreshToken,
      accessExpiresAt,
    };
  }

  const api: GqlAPI = {
    async getAccessTokens() {
      return await api.getTokensFromKeychain();
    },

    async getTokensFromKeychain(): Promise<GraphQLAccessToken | undefined> {
      logger.debug("Checking tokens in keychain");

      _jwt = (await getToken({ account_name: "gqlAccessToken", deps })) ?? "";
      _refresh =
        (await getToken({ account_name: "gqlRefreshToken", deps })) ?? "";

      const accessTokenExpiresAt = await getToken({
        account_name: "gqlAccessTokenExpiresAt",
        deps,
      });
      _expiresAt = accessTokenExpiresAt ? Number(accessTokenExpiresAt) : null;

      const result = {
        jwtToken: _jwt,
        refreshToken: _refresh,
        accessTokenExpiresAt: _expiresAt,
      };

      if (api.validateAccessToken()) {
        logger.debug(result);

        return result;
      }

      return;
    },

    validateAccessToken(): boolean {
      logger.debug("Validating access tokens");

      if (!_expiresAt) {
        logger.debug("accessTokenExpiresAt is undefined or null");
        return false;
      }

      const now = new Date();
      const accessTokenExpiresAt = new Date(_expiresAt);
      const result = accessTokenExpiresAt > now;

      logger.debug(`Access tokens are ${result ? "valid" : "not valid"}`);

      return result;
    },

    async login(options?: {
      option?: string;
      apiURL?: string;
      authProfileUUID?: string;
    }): Promise<GraphQLAccessToken | undefined> {
      if (api.validateAccessToken()) {
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
        {
          name: "Authorization token",
          value: "token",
          description:
            "Paste an existing authorization token (JWT). Skips the login query and action",
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
        case "token":
          const authorizationToken = (await prompter.getAuthorizationToken())
            .trim()
            .replace(/^Bearer\s+/i, "");

          return await parseLoginResult({
            jwtToken: authorizationToken,
            accessExpiresIn: getJWTExpiresIn(authorizationToken, logger),
          });

        case "query":
          const authProfileUuid =
            options?.authProfileUUID ?? (await prompter.getAuthProfileUUID());
          const username = await prompter.getUsername();
          const password = await prompter.getPassword();
          const loginQueryStr = loginQuery(username, password, authProfileUuid);
          const { data: loginQueryData, error: loginQueryError } =
            await api.request<AuthenticationSuccessPayload>(
              { query: loginQueryStr },
              parsedAPIURL,
            );

          if (loginQueryError) {
            logger.error(loginQueryError.message);
            if (
              loginQueryError.message ===
              "A valid authentication profile must be provided"
            ) {
              return await api.login({ option: choice, apiURL: parsedAPIURL });
            }
            if (
              loginQueryError.message === "Wrong credentials, please try again"
            ) {
              return await api.login({
                option: choice,
                apiURL: parsedAPIURL,
                authProfileUUID: options?.authProfileUUID,
              });
            }
            return;
          }

          if (!loginQueryData) return;

          return parseLoginResult(loginQueryData.login);

        case "action":
          const query = await promptActionLoginQuery({ prompter });
          if (!parsedAPIURL) throw new Error("Invalid API URL");
          const { data: loginMutationData, error: loginMutationError } =
            await api.request<{
              action: { results: AuthenticationTokenPayload };
            }>(query, parsedAPIURL);

          if (loginMutationError) {
            logger.error(loginMutationError.message);
            if (
              loginMutationError.message ===
              "A valid authentication profile must be provided"
            ) {
              return await api.login({
                option: choice,
                apiURL: parsedAPIURL,
              });
            }
            if (
              loginMutationError.message ===
              "Wrong credentials, please try again"
            ) {
              return await api.login({
                option: choice,
                apiURL: parsedAPIURL,
                authProfileUUID: options?.authProfileUUID,
              });
            }
            return;
          }

          if (!loginMutationData) return;
          return await parseLoginResult(loginMutationData?.action.results);
      }
    },

    async request<D = any>(
      body: Record<string, any>,
      url: string,
      headers?: Record<string, string>,
    ): Promise<GraphQLResponse<D>> {
      logger.debug(`Preparing POST request to ${url}`);
      logger.debug({ body, headers });

      const response = await fetch(url, {
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
    },
  };

  return api;
}
