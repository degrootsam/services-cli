import { describe, it, expect, beforeEach } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";
import { keytarStore, mockedKeytar } from "../__mocks__/keytar/index.js";
import { clearAllTokens, saveToken } from "../utils/keychain/index.js";

const deps = { logger: autoMock({ debug() {}, info() {} }) } as any;

describe("clearAllTokens", () => {
  beforeEach(() => {
    keytarStore.clear();
    mockedKeytar.deletePassword.mockClear();
  });

  it("removes every stored token and reports how many existed", async () => {
    await saveToken({ account_name: "gqlAccessToken", token: "a", deps });
    await saveToken({ account_name: "fusionAuthToken", token: "b", deps });

    expect(await clearAllTokens({ deps })).toBe(2);
    expect(keytarStore.size).toBe(0);
    expect(
      mockedKeytar.deletePassword.mock.calls.map(([, account]) => account),
    ).toEqual([
      "gqlAccessToken",
      "gqlRefreshToken",
      "gqlAccessTokenExpiresAt",
      "fusionAuthToken",
    ]);
  });

  it("reports 0 when nothing was stored", async () => {
    expect(await clearAllTokens({ deps })).toBe(0);
  });
});
