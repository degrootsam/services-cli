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
