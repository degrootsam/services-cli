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
