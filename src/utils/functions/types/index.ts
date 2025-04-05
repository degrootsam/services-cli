export type FunctionResult = {
  name: string;
  version?: string;
  status: "ok" | "error";
  id?: string;
  error?: string;
};
export type PublishResponse = {
  created: FunctionResult[];
  updated: FunctionResult[];
  deleted: FunctionResult[];
  compiled: boolean;
  message?: string;
};

export type Functions = Record<string, FunctionInfo>;

export type FunctionInfo = {
  versions: Set<string>;
  latestVersion: string;
  path: string;
  validation: FunctionValidation;
  fileType: "js" | "ts";
};

export type FunctionValidation = {
  valid: boolean;
  info: FunctionValidationInfo;
};

export type FunctionValidationInfo = {
  isDefaultExport: boolean;
  isAsync: boolean;
  matchesName: boolean;
};
