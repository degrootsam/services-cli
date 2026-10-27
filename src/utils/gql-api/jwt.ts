import type { LoggerAPI } from "../logger/index.js";

// Seconds until the token's exp claim, if it has one
export function getJWTExpiresIn(
  token: string,
  logger: LoggerAPI,
): number | undefined {
  try {
    const [, payload] = token.split(".");
    if (!payload) return;
    const { exp } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { exp?: number };
    if (typeof exp !== "number") return;
    return exp - Math.floor(Date.now() / 1000);
  } catch (err) {
    logger.debug("Unable to decode JWT expiry", err);
    return;
  }
}
