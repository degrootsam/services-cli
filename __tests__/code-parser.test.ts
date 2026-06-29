import { jest } from "@jest/globals";

import { CodeParser } from "../src/utils/index";
import { FunctionInfo } from "../src/utils/functions/types";

describe("code-parser", () => {
  describe("parses javascript", () => {
    const functionInfo: FunctionInfo = {
      fileType: "js",
      latestVersion: "1.0",
      path: "",
      validation: {
        info: {
          isAsync: false,
          isDefaultExport: false,
          matchesName: false,
        },
        valid: false,
      },
      versions: new Set(["1.0"]),
    };

    it("validates as async ", () => {
      const codeParser = new CodeParser("js");

      const code = `
      export default async function helloWorld(){ return null; }
    `;

      const expectedFunctionInfo: FunctionInfo = {
        ...functionInfo,
        validation: {
          info: {
            isAsync: true,
            isDefaultExport: false,
            matchesName: false,
          },
          valid: false,
        },
      };

      const functionName = "helloWorld";

      expect(
        codeParser.validateFunction(code, functionInfo, functionName),
      ).toStrictEqual(expectedFunctionInfo);
    });
  });
});
