import { createCodeParser } from "../utils/code-parser";
import { createLogger } from "../utils/logger";
import { FunctionInfo } from "../utils/functions/types";

const logger = createLogger({ verbose: false });

describe("createCodeParser", () => {
  describe("parses javascript", () => {
    const functionInfo: FunctionInfo = {
      fileType: "js",
      latestVersion: "1.0",
      path: "",
      validation: {
        info: { isAsync: false, isDefaultExport: false, matchesName: false },
        valid: false,
      },
      versions: new Set(["1.0"]),
    };

    it("validates as async", () => {
      const codeParser = createCodeParser("js", logger);
      const code = `export default async function helloWorld(){ return null; }`;

      const expected: FunctionInfo = {
        ...functionInfo,
        validation: {
          // export default async function helloWorld() → isDefaultExport & matchesName are both true
          info: { isAsync: true, isDefaultExport: true, matchesName: true },
          valid: true,
        },
      };

      expect(
        codeParser.validateFunction(code, functionInfo, "helloWorld"),
      ).toStrictEqual(expected);
    });

    it("validates as default export", () => {
      const codeParser = createCodeParser("js", logger);
      const code = `async function helloWorld(){ return null; } export default helloWorld;`;

      const result = codeParser.validateFunction(
        code,
        functionInfo,
        "helloWorld",
      );
      expect(result.validation.info.isDefaultExport).toBe(true);
    });
  });
});
