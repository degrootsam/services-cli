import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";
import { keytarStore } from "../__mocks__/keytar/index.js";
import { getToken, saveToken } from "../utils/keychain/index.js";
import { createGraphQLAPI } from "../utils/gql-api/index.js";

const deps = {
  logger: autoMock({ debug() {}, error() {}, info() {}, warn() {} }),
  prompter: {},
  config: {
    tokens: {},
    getApiURL: mock(async () => "https://app.example.com/api"),
  },
} as any;

// A JWT whose exp claim is one hour from now
const jwt = () =>
  [
    "header",
    Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url"),
    "signature",
  ].join(".");

const realFetch = globalThis.fetch;
let queries: string[] = [];
const respondWith = (refreshToken: any) => {
  globalThis.fetch = mock(async (_url: any, init: any) => {
    queries.push(JSON.parse(init.body).query);
    return new Response(JSON.stringify({ data: { refreshToken } }));
  }) as any;
};

beforeEach(async () => {
  keytarStore.clear();
  queries = [];
  await saveToken({ account_name: "gqlAccessToken", token: "old-jwt", deps });
  await saveToken({
    account_name: "gqlRefreshToken",
    token: "old-refresh",
    deps,
  });
  await saveToken({
    account_name: "gqlAccessTokenExpiresAt",
    token: String(Date.now() - 1000),
    deps,
  });
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe("GraphQL token refresh", () => {
  it("refreshes an expired access token with the stored refresh token", async () => {
    const newJwt = jwt();
    respondWith({
      isValid: true,
      jwtToken: newJwt,
      refreshToken: "new-refresh",
    });

    const tokens = await createGraphQLAPI({ deps }).getAccessTokens();

    expect(tokens?.jwtToken).toBe(newJwt);
    expect(queries[0]).toContain('refreshToken(token: "old-refresh")');
    expect(await getToken({ account_name: "gqlAccessToken", deps })).toBe(
      newJwt,
    );
    expect(await getToken({ account_name: "gqlRefreshToken", deps })).toBe(
      "new-refresh",
    );
  });

  it("returns nothing when the refresh token is rejected", async () => {
    respondWith({ isValid: false, jwtToken: null, refreshToken: null });
    expect(await createGraphQLAPI({ deps }).getAccessTokens()).toBeUndefined();
  });

  it("returns nothing when the refresh request fails", async () => {
    globalThis.fetch = mock(
      async () => new Response("", { status: 500 }),
    ) as any;
    expect(await createGraphQLAPI({ deps }).getAccessTokens()).toBeUndefined();
  });

  it("does not call the API while the access token is still valid", async () => {
    await saveToken({
      account_name: "gqlAccessTokenExpiresAt",
      token: String(Date.now() + 60_000),
      deps,
    });
    respondWith({});
    const tokens = await createGraphQLAPI({ deps }).getAccessTokens();
    expect(tokens?.jwtToken).toBe("old-jwt");
    expect(queries).toEqual([]);
  });

  it("uses BBS_GRAPHQL_TOKEN without the Keychain or the API", async () => {
    respondWith({});
    const api = createGraphQLAPI({
      deps: { ...deps, config: { ...deps.config, tokens: { graphql: "env" } } },
    });
    expect((await api.getAccessTokens())?.jwtToken).toBe("env");
    expect(queries).toEqual([]);
  });
});
