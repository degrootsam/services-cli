import keytar from "keytar";
import { logger } from "..";

interface AccountNames {
  gqlAccessToken: string;
  gqlRefreshToken: string;
  gqlAccessTokenExpiresAt: string;
}
const SERVICE_NAME = process.env.SERVICE_NAME ?? "bbs-cli-dev";

export async function saveToken(
  account_name: keyof AccountNames,
  token: string,
) {
  logger.debug(`Storing password in Keychain`);
  await keytar.setPassword(SERVICE_NAME, account_name, token);
  logger.debug(`Password stored in Keychain`);
}

export async function getToken(
  account_name: keyof AccountNames,
): Promise<string | null> {
  logger.debug(`Fetching password from Keychain`);
  const result = keytar.getPassword(SERVICE_NAME, account_name);
  logger.debug(`Passwor fetched from Keychain`);
  return result;
}

export async function clearToken(account_name: keyof AccountNames) {
  logger.debug(`Clearing password from Keychain`);
  await keytar.deletePassword(SERVICE_NAME, account_name);
  logger.debug(`Password cleared from Keychain`);
}
