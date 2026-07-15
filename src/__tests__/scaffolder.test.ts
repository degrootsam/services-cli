import { mock, describe, it, expect } from "bun:test";
import path from "path";
import { generateBbsConfigFile } from "../utils/scaffolder";
import type { AppDeps } from "../utils/types";

const makeDeps = () =>
  ({
    director: {
      writeFile: mock(),
    },
  }) as Partial<AppDeps> as AppDeps;

describe("generateBbsConfigFile", () => {
  it("writes a starter bbs.config.ts into the target directory", () => {
    const deps = makeDeps();
    generateBbsConfigFile({ deps, targetDir: "my-project" });

    expect(deps.director.writeFile).toHaveBeenCalledTimes(1);
    const [outputPath, content] = (deps.director.writeFile as any).mock
      .calls[0];
    expect(outputPath).toBe(path.resolve("my-project", "bbs.config.ts"));
    expect(content).toContain('import { createConfig } from "bbs-cli";');
    expect(content).toContain("export default createConfig({");
  });
});
