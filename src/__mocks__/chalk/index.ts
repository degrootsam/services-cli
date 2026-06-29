// __mocks__/chalk.js
const chalk = new Proxy(
  {},
  {
    get: () => (text: string) => text,
  },
);
export default chalk;
