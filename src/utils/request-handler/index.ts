import { config, logger } from "..";
import fetch from "node-fetch";

type RequestResponse<T> = {
  data?: T;
  responseStatus: number;
  error?: { message: string } | undefined;
};

export class RequestHandler {
  constructor(private baseUrl: string) {}

  async get<T>(
    endpoint: string,
    headers: Record<string, string> = {},
  ): Promise<RequestResponse<T>> {
    return this.request<T>("GET", endpoint, undefined, headers);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<RequestResponse<T>> {
    return this.request<T>("POST", endpoint, body, headers);
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<RequestResponse<T>> {
    return this.request<T>("PUT", endpoint, body, headers);
  }

  async delete<T>(
    endpoint: string,
    headers: Record<string, string> = {},
  ): Promise<RequestResponse<T>> {
    return this.request<T>("DELETE", endpoint, undefined, headers);
  }

  private async request<T>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    body?: unknown,
    headers: Record<string, string> = {},
  ): Promise<RequestResponse<T>> {
    logger.debug(`${method} request at ${this.baseUrl}${endpoint}`);
    logger.debug("Body:", body);
    logger.debug({ headers });

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        ...headers,
      },
      body: body ? (body as any) : undefined,
    });

    logger.debug(`Response status: ${response.status}`);
    logger.debug(response);

    if (!response.ok) {
      return {
        error: {
          message: response.statusText,
        },
        responseStatus: response.status,
      };
    }

    const data = (await response.json()) as T;

    logger.debug("Parsed result:");
    logger.debug({ data });

    return { data, responseStatus: response.status };
  }
}
