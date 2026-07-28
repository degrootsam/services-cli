import fetch from "node-fetch";
import { AppDeps } from "../types";

type RequestResponse<T> = {
  data?: T;
  responseStatus: number;
  error?: { message: string } | undefined;
  response?: Response;
};

export class RequestHandler {
  constructor(private baseUrl: string) {}

  async get({
    endpoint,
    headers = {},
    deps,
  }: {
    endpoint: string;
    headers?: Record<string, string>;
    deps: AppDeps;
  }) {
    return this.request({ method: "GET", endpoint, headers, deps });
  }

  async post({
    endpoint,
    headers = {},
    body,
    deps,
  }: {
    endpoint: string;
    headers?: Record<string, string>;
    body: unknown;
    deps: AppDeps;
  }) {
    return this.request({ method: "POST", endpoint, body, headers, deps });
  }

  async put({
    endpoint,
    body,
    headers = {},
    deps,
  }: {
    endpoint: string;
    body: unknown;
    headers?: Record<string, string>;
    deps: AppDeps;
  }) {
    return this.request({
      method: "PUT",
      endpoint,
      body,
      headers,
      deps,
    });
  }

  async delete({
    endpoint,
    headers,
    deps,
  }: {
    endpoint: string;
    headers: Record<string, string>;
    deps: AppDeps;
  }) {
    return this.request({ method: "DELETE", endpoint, headers, deps });
  }

  private async request({
    method,
    endpoint,
    body,
    headers = {},
    deps,
  }: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    endpoint: string;
    body?: unknown;
    headers?: Record<string, string>;
    deps: AppDeps;
  }) {
    deps.logger.debug(`${method} request at ${this.baseUrl}${endpoint}`);
    deps.logger.debug("Body:", body);
    deps.logger.debug({ headers });

    return await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        ...headers,
      },
      body: body ? (body as any) : undefined,
    });
  }
}
