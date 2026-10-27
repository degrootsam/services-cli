import { describe, it, expect, mock } from "bun:test";
import path from "path";
import { getCLIVersion } from "../utils/cli-version.js";

const makeDirector = (content: string) => ({
  readFileSync: mock((_path: string, _silent?: boolean) => content),
});

describe("getCLIVersion", () => {
  it("reads the version from the CLI's own package.json", () => {
    const director = makeDirector(JSON.stringify({ version: "1.2.3" }));
    expect(getCLIVersion({ director } as any)).toBe("1.2.3");
    const [filePath] = director.readFileSync.mock.calls[0];
    expect(filePath).toBe(path.resolve(import.meta.dir, "../../package.json"));
  });

  it("falls back to unknown when package.json cannot be read", () => {
    expect(getCLIVersion({ director: makeDirector("") } as any)).toBe(
      "unknown",
    );
  });
});
