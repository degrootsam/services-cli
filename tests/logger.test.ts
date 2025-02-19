import chalk from "chalk";
import { logger } from "../src/utils/index";

describe("Test logger.debug", () => {
  let debugSpy: jest.SpyInstance;
  const prefix = chalk.bgWhite(chalk.black("DEBUG:"));

  beforeEach(() => {
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
  });

  test("should log output", () => {
    logger.debug("Hello World");
    expect(debugSpy).toHaveBeenCalledWith(prefix, "Hello World");
  });
});

describe("Test logger.error", () => {
  let errorSpy: jest.SpyInstance;
  const prefix = chalk.bgRed(chalk.black("ERROR:"));

  beforeEach(() => {
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  test("should log output", () => {
    logger.error("Hello World");
    expect(errorSpy).toHaveBeenCalledWith(prefix, "Hello World");
  });

  test("should log objects", () => {
    const testObject = {
      message: "Hello World",
    };
    logger.error(testObject);
    expect(errorSpy).toHaveBeenCalledWith(prefix, testObject);
  });
});
