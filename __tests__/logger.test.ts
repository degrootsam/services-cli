import { jest } from "@jest/globals";
import { logger } from "../src/utils/index";
import { DEBUG_PREFIX, ERROR_PREFIX, createLogger } from "../src/utils/logger";

describe("Logger", () => {
  let debugSpy: jest.SpiedFunction<typeof console.debug>;
  let errorSpy: jest.SpiedFunction<typeof console.error>;

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

describe("createLogger", () => {
  let debugSpy: ReturnType<typeof jest.spyOn>;
  let errorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    debugSpy.mockRestore();
    errorSpy.mockRestore();
  });

  it("does not debug log when verbose=false", () => {
    const logger = createLogger({ verbose: false });
    logger.debug("hello");
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("debug logs when verbose=true", () => {
    const logger = createLogger({ verbose: true });
    logger.debug("hello");
    expect(debugSpy).toHaveBeenCalledWith(DEBUG_PREFIX, "hello");
  });

  it("toggleVerbose enables debug logging", () => {
    const logger = createLogger({ verbose: false });
    logger.toggleVerbose(true);
    logger.debug("hello");
    expect(debugSpy).toHaveBeenCalledWith(DEBUG_PREFIX, "hello");
  });

  it("error logs with ERROR_PREFIX", () => {
    const logger = createLogger();
    logger.error("oops");
    expect(errorSpy).toHaveBeenCalledWith(ERROR_PREFIX, "oops");
  });
});
