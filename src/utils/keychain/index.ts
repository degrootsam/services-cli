import keytar from "keytar";
import { AppDeps } from "../types.js";

interface AccountNames {
  gqlAccessToken: string;
  gqlRefreshToken: string;
  gqlAccessTokenExpiresAt: string;
  fusionAuthToken: string;
}
const SERVICE_NAME = process.env.SERVICE_NAME ?? "bbs-cli-dev";

export async function saveToken({
  account_name,
  token,
  deps,
}: {
  account_name: keyof AccountNames;
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
  account_name: keyof AccountNames;
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
  account_name: keyof AccountNames;
  deps: AppDeps;
}) {
  deps.logger.debug(`Clearing password from Keychain`);
  await keytar.deletePassword(SERVICE_NAME, account_name);
  deps.logger.debug(`Password cleared from Keychain`);
}
