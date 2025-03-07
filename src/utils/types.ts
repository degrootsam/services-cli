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
    apiURL: string;
    env: string;
    zone: string;
    schemaURL: string;
    functionSchemaPath: string;
    cacheDir: string;
    fusionAuthURL: string;
    builderAPIURL: string;
    blockstoreAPIURL: string;
    domain: string;
    agentOptions?: AgentOptions;
    skipCompile?: false;
  };
};

export type Functions = Record<string, FunctionInfo>;

export type FunctionInfo = {
  versions: string[];
  latestVersion: string;
  path: string;
};
