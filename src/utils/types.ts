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
  };
};

export type Functions = Record<string, FunctionInfo>;

export type FunctionInfo = {
  versions: string[];
  latestVersion: string;
  path: string;
};
