import type { LoggerAPI } from "./logger/index.js";
import type { DirectorAPI } from "./director/index.js";
import type { PrompterAPI } from "./prompter/index.js";
import type { ConfigAPI } from "./config/index.js";
import type { StateAPI } from "./state/index.js";
import type { createSpinner } from "nanospinner";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

export type ActionInputTypes = string | number;

export interface ActionObject {
  [key: string]: ActionInputTypes | ActionObject;
}

export type ActionCollection = Array<ActionInputTypes | ActionObject>;

export type AllowedActionInputTypes =
  | ActionInputTypes
  | ActionObject
  | ActionCollection;

export type SpinnerAPI = ReturnType<typeof createSpinner>;

export type AppDeps = {
  logger: LoggerAPI;
  director: DirectorAPI;
  prompter: PrompterAPI;
  config: ConfigAPI;
  state: StateAPI;
  spinner: SpinnerAPI;
};

export type ProjectTypeKey = "js" | "ts" | "wasm";
