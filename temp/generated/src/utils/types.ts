export type Config = {
  scaffolder: {
    links: {
      actions: string;
      components: string;
      gqlCodeGen: string;
    };
  };
  options: {
    apiURL: string;
  };
};
