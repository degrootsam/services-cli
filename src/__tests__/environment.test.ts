import { describe, it, expect } from "bun:test";
import {
  isInteractive,
  readEnvConfig,
  readEnvTokens,
} from "../utils/environment.js";

describe("isInteractive", () => {
  it("is interactive by default", () => {
    expect(
      isInteractive({ argv: ["bbs", "functions", "publish"], env: {} }),
    ).toBe(true);
  });

  it("is not interactive with --no-input", () => {
    expect(isInteractive({ argv: ["bbs", "--no-input"], env: {} })).toBe(false);
  });

  it("is not interactive on CI, unless CI is false or 0", () => {
    expect(isInteractive({ argv: [], env: { CI: "true" } })).toBe(false);
    expect(isInteractive({ argv: [], env: { CI: "1" } })).toBe(false);
    expect(isInteractive({ argv: [], env: { CI: "false" } })).toBe(true);
    expect(isInteractive({ argv: [], env: { CI: "0" } })).toBe(true);
  });
});

describe("readEnvConfig", () => {
  it("maps BBS_ variables onto config keys and skips empty ones", () => {
    expect(
      readEnvConfig({
        BBS_APP_UUID: "uuid",
        BBS_APP_IDENTIFIER: "my-app",
        BBS_ZONE: "",
        BBS_ENV: "acceptance",
      }),
    ).toEqual({
      app: { uuid: "uuid", identifier: "my-app" },
      options: { env: "acceptance" },
    });
  });

  it("returns an empty object without BBS_ variables", () => {
    expect(readEnvConfig({})).toEqual({});
  });
});

describe("readEnvTokens", () => {
  it("reads BBS_TOKEN and BBS_GRAPHQL_TOKEN", () => {
    expect(
      readEnvTokens({ BBS_TOKEN: "fa", BBS_GRAPHQL_TOKEN: "gql" }),
    ).toEqual({ fusionAuth: "fa", graphql: "gql" });
    expect(readEnvTokens({ BBS_TOKEN: "" })).toEqual({});
  });
});
