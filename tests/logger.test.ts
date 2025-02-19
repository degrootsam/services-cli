import chalk from "chalk";
import { logger } from "../src/utils/index";
import { DEBUG_PREFIX, ERROR_PREFIX } from "../src/utils/logger";

describe("Logger", () => {
  let debugSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("should log output if verbose is turned on", () => {
    logger.toggleVerbose(true);
    logger.debug("Hello World");
    expect(debugSpy).toHaveBeenCalledWith(DEBUG_PREFIX, "Hello World");
  });

  it("should not log output if verbose is turned off", () => {
    logger.toggleVerbose(false);
    logger.debug("Hello World");
    expect(debugSpy).toHaveBeenCalledTimes(0);
  });

  test("should log output", () => {
    logger.error("Hello World");
    expect(errorSpy).toHaveBeenCalledWith(ERROR_PREFIX, "Hello World");
  });
});
