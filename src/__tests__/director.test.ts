import { describe, it, expect } from "bun:test";
import { createDirector } from "../utils/director";
import { createLogger } from "../utils/logger";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("createDirector", () => {
  const logger = createLogger({ verbose: false });
  const director = createDirector({ logger, dirPath: __dirname });

  it("returns an object with core filesystem methods", () => {
    expect(typeof director.readFile).toBe("function");
    expect(typeof director.writeFile).toBe("function");
    expect(typeof director.exists).toBe("function");
    expect(typeof director.runCommand).toBe("function");
  });

  it("exists returns false for a non-existent path", async () => {
    expect(await director.exists("/nonexistent/path/xyz123")).toBe(false);
  });

  it("exists returns true for __dirname", async () => {
    expect(await director.exists(__dirname)).toBe(true);
  });

  it("resolveCLIPath returns a non-empty string", () => {
    const result = director.resolveCLIPath();
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("resolveCLITemplatePath resolves relative to CLI path", () => {
    const result = director.resolveCLITemplatePath("codegen-templates");
    expect(result).toContain("codegen-templates");
  });
});
