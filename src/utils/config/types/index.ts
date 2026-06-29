import { TransformOptions } from "esbuild";
import { AgentOptions } from "http";

export type TemplateConfig = {
  name: string;
  path: string;
  url: string;
  description?: string;
};

export type ProjectVariants = {
  ts: TemplateConfig;
  js: TemplateConfig;
};

export type ScaffolderConfig = {
  cacheDir: string;
  templates: {
    name: string;
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
    versions?: {
      templates?: string;
      functions?: {
        js?: string;
        ts?: string;
      };
      components?: {
        js?: string;
        ts?: string;
      };
    };
  };
  tests: { directory: string; transform?: TransformOptions };
};

export type BuildSettings = {
  srcDir: string;
  buildPath?: string;
};

export type Config = {
  buildOptions:
    | {
        js?: BuildSettings;
        ts?: BuildSettings;
      }
    | undefined;
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
