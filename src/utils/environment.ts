import type { Config } from "./config/types/index.js";
import type { DeepPartial } from "./types.js";

type Env = Record<string, string | undefined>;

export type EnvTokens = {
  fusionAuth?: string;
  graphql?: string;
};

export function isInteractive({
  argv,
  env,
}: {
  argv: string[];
  env: Env;
}): boolean {
  if (argv.includes("--no-input")) return false;
  const ci = env.CI;
  return !ci || ci === "false" || ci === "0";
}

// BBS_ variables override bbs.config.ts, so CI can configure a checked-in project
export function readEnvConfig(env: Env): DeepPartial<Config> {
  const config: DeepPartial<Config> = {};
  const app = {
    ...(env.BBS_APP_UUID && { uuid: env.BBS_APP_UUID }),
    ...(env.BBS_APP_IDENTIFIER && { identifier: env.BBS_APP_IDENTIFIER }),
    ...(env.BBS_ZONE && { zone: env.BBS_ZONE }),
  };
  if (Object.keys(app).length > 0) config.app = app;
  if (env.BBS_ENV) config.options = { env: env.BBS_ENV };
  return config;
}

export function readEnvTokens(env: Env): EnvTokens {
  return {
    ...(env.BBS_TOKEN && { fusionAuth: env.BBS_TOKEN }),
    ...(env.BBS_GRAPHQL_TOKEN && { graphql: env.BBS_GRAPHQL_TOKEN }),
  };
}
