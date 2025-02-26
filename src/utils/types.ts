type TemplateLinks = {
  typescript: string;
  javascript: string;
};

export type Config = {
  scaffolder: {
    templates: {
      functions: TemplateLinks;
      components: TemplateLinks;
    };
    codeGeneration: {
      gqlCodeGen: string;
    };
  };
  options: {
    apiURL: string;
  };
};
