import { config, logger } from "..";
import fetch from "node-fetch";

type RequestResponse<T> = {
  data?: T;
  responseStatus: number;
  error?: { message: string } | undefined;
  response?: Response;
};

export class RequestHandler {
  constructor(private baseUrl: string) {}

  async get(endpoint: string, headers: Record<string, string> = {}) {
    return this.request("GET", endpoint, undefined, headers);
  }

  async post(
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    return this.request("POST", endpoint, body, headers);
  }

  async put(
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    return this.request("PUT", endpoint, body, headers);
  }

  async delete(endpoint: string, headers: Record<string, string> = {}) {
    return this.request("DELETE", endpoint, undefined, headers);
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ) {
    logger.debug(`${method} request at ${this.baseUrl}${endpoint}`);
    logger.debug("Body:", body);
    logger.debug({ headers });

    return await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        ...headers,
      },
      body: body ? (body as any) : undefined,
    });
  }
}
