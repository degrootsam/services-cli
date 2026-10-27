import keytar from "keytar";
import { AppDeps } from "../types.js";

const ACCOUNT_NAMES = [
  "gqlAccessToken",
  "gqlRefreshToken",
  "gqlAccessTokenExpiresAt",
  "fusionAuthToken",
] as const;

type AccountName = (typeof ACCOUNT_NAMES)[number];
const SERVICE_NAME = process.env.SERVICE_NAME ?? "bbs-cli-dev";

export async function saveToken({
  account_name,
  token,
  deps,
}: {
  account_name: AccountName;
  token: string;
  deps: AppDeps;
}) {
  deps.logger.debug(`Storing password in Keychain`);
  await keytar.setPassword(SERVICE_NAME, account_name, token);
  deps.logger.debug(`Password stored in Keychain`);
}

export async function getToken({
  account_name,
  deps,
}: {
  account_name: AccountName;
  deps: AppDeps;
}): Promise<string | null> {
  deps.logger.debug(`Fetching password from Keychain`);
  const result = await keytar.getPassword(SERVICE_NAME, account_name);
  deps.logger.debug(`Password fetched from Keychain ${result?.length}`);
  return result;
}

export async function clearToken({
  account_name,
  deps,
}: {
  account_name: AccountName;
  deps: AppDeps;
}) {
  deps.logger.debug(`Clearing password from Keychain`);
  await keytar.deletePassword(SERVICE_NAME, account_name);
  deps.logger.debug(`Password cleared from Keychain`);
}

// Returns how many tokens were stored
export async function clearAllTokens({
  deps,
}: {
  deps: AppDeps;
}): Promise<number> {
  let cleared = 0;
  for (const account_name of ACCOUNT_NAMES) {
    deps.logger.debug(`Clearing ${account_name} from Keychain`);
    if (await keytar.deletePassword(SERVICE_NAME, account_name)) cleared++;
  }
  return cleared;
}
