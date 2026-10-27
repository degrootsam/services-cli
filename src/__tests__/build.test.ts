import { describe, it, expect, afterEach } from "bun:test";
import fs from "fs";
import os from "os";
import path from "path";
import { autoMock } from "../__mocks__/utils.js";
import { buildFunctions } from "../utils/functions/build.js";

let projectDir = "";
const cwd = process.cwd();

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(projectDir, { recursive: true, force: true });
});

describe("buildFunctions", () => {
  it("keeps the name/version folders when there is only one function", async () => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), "bbs-build-"));
    const functionDir = path.join(projectDir, "functions", "say-hello", "1.0");
    fs.mkdirSync(functionDir, { recursive: true });
    fs.writeFileSync(
      path.join(functionDir, "index.js"),
      "const sayHello = async () => ({ result: 'hi' });\nexport default sayHello;\n",
    );
    fs.writeFileSync(path.join(projectDir, "package.json"), "{}");
    process.chdir(projectDir);

    const deps = {
      logger: autoMock({ debug() {} }),
      spinner: autoMock({ start() {}, success() {} }),
      config: { srcDir: "functions", projectExtension: ".js" },
    } as any;
    await buildFunctions({ deps, outdir: "out", type: "js" });

    expect(
      fs.existsSync(
        path.join(projectDir, "out/app/functions/say-hello/1.0/index.js"),
      ),
    ).toBe(true);
  });
});
