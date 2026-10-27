import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { autoMock } from "../__mocks__/utils.js";
import { createLogger } from "../utils/logger/index.js";
import { validateFunctions } from "../utils/functions/validate.js";

const functions = () =>
  ({
    "say-hello": {
      fileType: "js",
      latestVersion: "1.0",
      path: "/project/functions/say-hello",
      versions: new Set(["1.0"]),
      validation: {
        valid: false,
        info: { isAsync: false, isDefaultExport: false, matchesName: false },
      },
    },
  }) as any;

const makeDeps = () => {
  const logger = createLogger();
  return {
    logger: { ...logger, debug: mock() },
    spinner: autoMock({ start() {}, success() {}, stop() {} }),
    director: {
      readFile: mock(
        async () =>
          "const sayHello = async () => ({ result: 'hi' });\nexport default sayHello;\n",
      ),
    },
  } as any;
};

const log = spyOn(console, "log");
afterEach(() => log.mockClear());

describe("validateFunctions", () => {
  it("reports the validation result, not the unvalidated input", async () => {
    const result = await validateFunctions({
      deps: makeDeps(),
      functions: functions(),
      type: "js",
    });
    expect(result["say-hello"].validation.valid).toBe(true);
    const output = log.mock.calls.flat().join("\n");
    expect(output).toContain("√ say-hello/1.0");
    expect(output).not.toContain("default export");
  });

  it("can skip the report", async () => {
    await validateFunctions({
      deps: makeDeps(),
      functions: functions(),
      type: "js",
      log: false,
    });
    expect(log).not.toHaveBeenCalled();
  });
});
