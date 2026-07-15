import { describe, it, expect } from "bun:test";
import { createGit, compareVersions } from "../utils/git";
import { createLogger } from "../utils/logger";
import type { AppDeps } from "../utils/types";

describe("compareVersions", () => {
  it("returns 1 when a is greater than b", () => {
    expect(compareVersions({ a: "1.1.0", b: "1.0.0" })).toBe(1);
  });

  it("returns -1 when a is less than b", () => {
    expect(compareVersions({ a: "1.0.0", b: "1.1.0" })).toBe(-1);
  });

  it("returns 0 when versions are equal", () => {
    expect(compareVersions({ a: "1.0.0", b: "1.0.0" })).toBe(0);
  });
});

describe("createGit", () => {
  it("returns an object with git methods", () => {
    const mockDeps = {
      logger: createLogger({ verbose: false }),
      director: { runCommand: async () => "" } as any,
      prompter: {} as any,
      config: {} as any,
      spinner: {} as any,
    } as AppDeps;

    const git = createGit({
      deps: mockDeps,
      cfg: { name: "test-repo", path: "/tmp/test" },
    });
    expect(typeof git.getLatestRemoteTag).toBe("function");
    expect(typeof git.handleUpdate).toBe("function");
    expect(typeof git.checkForNewVersion).toBe("function");
  });
});
