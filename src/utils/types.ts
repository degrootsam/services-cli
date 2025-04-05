import { TransformOptions } from "esbuild";
import { AgentOptions } from "http";
import { Functions } from "./functions/types";

export type TemplateConfig = {
  path: string;
  url: string;
  version?: string;
  description?: string;
};

export type ProjectVariants = {
  ts: TemplateConfig;
  js: TemplateConfig;
};

export type ScaffolderConfig = {
  templates: {
    functions: {
      new: string;
      test: string;
      project: ProjectVariants;
      typegen: string;
    };
    components: {
      new: string;
      project: TemplateConfig;
    };
    path: string;
    url: string;
    version?: string;
  };
  tests: { directory: string; transform?: TransformOptions };
};

export type Config = {
  scaffolder: ScaffolderConfig;
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
