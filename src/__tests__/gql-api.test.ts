import { describe, it, expect, mock, afterEach } from "bun:test";
import { parse } from "graphql";
import { autoMock } from "../__mocks__/utils.js";

const { createGraphQLAPI } = await import("../utils/gql-api/index.js");

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

const makeDeps = (password: string) =>
  ({
    logger: autoMock({ debug() {}, error() {}, info() {}, warn() {} }),
    prompter: {
      getUsername: mock(async () => "user@example.com"),
      getPassword: mock(async () => password),
      getAuthProfileUUID: mock(async () => "profile"),
    },
    config: { getApiURL: mock(async () => "https://config.example.com") },
  }) as any;

describe("GraphQL login query", () => {
  it("escapes credentials that contain quotes and backslashes", async () => {
    const password = 'pa"ss\\word';
    const requests: { url: string; query: string }[] = [];
    globalThis.fetch = mock(async (url: any, init: any) => {
      requests.push({ url, query: JSON.parse(init.body).query });
      return new Response(
        JSON.stringify({
          data: {
            login: {
              jwtToken: "jwt",
              refreshToken: "refresh",
              accessExpiresIn: 7200,
            },
          },
        }),
      );
    }) as any;

    const api = createGraphQLAPI({ deps: makeDeps(password) });
    await api.login({ option: "query", apiURL: "https://login.example.com" });

    const [request] = requests;
    expect(request.url).toBe("https://login.example.com");
    const document = parse(request.query) as any;
    const args = document.definitions[0].selectionSet.selections[0].arguments;
    const values = Object.fromEntries(
      args.map((a: any) => [a.name.value, a.value.value]),
    );
    expect(values).toEqual({
      authProfileUuid: "profile",
      username: "user@example.com",
      password,
    });
  });
});
