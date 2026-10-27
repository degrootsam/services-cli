import { describe, it, expect, mock, beforeEach } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";

const stored: Record<string, string> = {};
mock.module("../utils/keychain/index.js", () => ({
  getToken: mock(
    async ({ account_name }: { account_name: string }) =>
      stored[account_name] ?? null,
  ),
  saveToken: mock(
    async ({
      account_name,
      token,
    }: {
      account_name: string;
      token: string;
    }) => {
      stored[account_name] = token;
    },
  ),
}));

const posts: { baseUrl: string; endpoint: string; headers?: any }[] = [];
let responses: { status: number; body: any }[] = [];
mock.module("../utils/request-handler/index.js", () => ({
  RequestHandler: class {
    constructor(private baseUrl: string) {}
    async post({ endpoint, headers }: { endpoint: string; headers?: any }) {
      posts.push({ baseUrl: this.baseUrl, endpoint, headers });
      const { status, body } = responses.shift()!;
      return { status, statusText: "", json: async () => body };
    }
  },
}));

const { default: FusionAuth } = await import("../utils/fusion-auth/index.js");

const makeDeps = () =>
  ({
    logger: autoMock({ debug() {}, error() {}, info() {}, warn() {} }),
    prompter: {
      getUsername: mock(async () => "user"),
      getPassword: mock(async () => "secret"),
      input: mock(async () => "123456"),
      getURL: mock(async () => "https://prompted.example.com"),
    },
    config: { fusionAuthURL: "" },
  }) as any;

const future = () => Date.now() + 60 * 60 * 1000;

describe("FusionAuth", () => {
  beforeEach(() => {
    for (const key of Object.keys(stored)) delete stored[key];
    posts.length = 0;
    responses = [];
  });

  it("returns the new token after logging in without a stored token", async () => {
    responses = [
      { status: 200, body: { token: "jwt", tokenExpirationInstant: future() } },
    ];
    const token = await new FusionAuth().getToken({ deps: makeDeps() });
    expect(token?.token).toBe("jwt");
  });

  it("sends the 2FA code to the same Fusion Auth URL as the login", async () => {
    responses = [
      { status: 242, body: { twoFactorId: "2fa" } },
      { status: 200, body: { token: "jwt", tokenExpirationInstant: future() } },
    ];
    const token = await new FusionAuth().getToken({ deps: makeDeps() });
    expect(token.token).toBe("jwt");
    expect(posts.map((p) => p.baseUrl)).toEqual([
      "https://prompted.example.com",
      "https://prompted.example.com",
    ]);
    expect(posts[1].headers?.["Content-Type"]).toContain("application/json");
  });
});
