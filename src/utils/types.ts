import { AgentOptions } from "http";

type TemplateLinks = {
  typescript: string;
  javascript: string;
};

export type Config = {
  scaffolder: {
    git: {
      name: string;
      url: string;
    };
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
  tests: {
    directory: string;
  };
  app: {
    uuid: string;
    identifier: string;
    zone: string;
  };
  options: {
    env: string;
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
  isDefaultExport: boolean;
  isAsync: boolean;
  matchesName: boolean;
};
