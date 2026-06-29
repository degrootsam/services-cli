import type { LoggerAPI } from "./logger";
import type { DirectorAPI } from "./director";
import type { PrompterAPI } from "./prompter";
import type { ConfigAPI } from "./config";
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
  spinner: SpinnerAPI;
};
