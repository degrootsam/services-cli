import { AgentOptions } from "http";

type TemplateLinks = {
  typescript: string;
  javascript: string;
};

export type Config = {
  scaffolder: {
    projects: {
      functions: TemplateLinks;
      components: TemplateLinks;
    };
    codeGeneration: {
      gqlCodeGen: string;
      newFunction: string;
      newComponent: string;
    };
  };
  options: {
    appUUID: string;
    appIdentifier: string;
    env: string;
    zone: string;
    schemaURL: string;
    appDomain: string;
    functionSchemaPath: string;
    cacheDir: string;
    fusionAuthURL: string;
    builderAPIURL: string;
    blockstoreAPIURL: string;
    domain: string;
    agentOptions?: AgentOptions;
    skipCompile?: boolean;
    https: boolean;
  };
};

export type Functions = Record<string, FunctionInfo>;

export type FunctionInfo = {
  versions: string[];
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
  exportedAs: string;
  isDefaultExport: boolean;
  isAsync: boolean;
};
