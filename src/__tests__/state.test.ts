import { mock, describe, it, expect } from "bun:test";
import path from "path";
import { createState } from "../utils/state";
import type { LoggerAPI } from "../utils/logger";
import type { DirectorAPI } from "../utils/director";

const makeDeps = () => ({
  director: {
    exists: mock(() => false),
    readFile: mock(() => ""),
    writeFile: mock(),
  } as Partial<DirectorAPI> as DirectorAPI,
  logger: {
    debug: mock(),
    error: mock(),
    info: mock(),
    warn: mock(),
    toggleVerbose: mock(),
    getValidationPrefix: mock(() => "√"),
    getValidationColor: mock(),
  } as LoggerAPI,
});

describe("createState", () => {
  it("starts empty when .bbs/state.json does not exist", () => {
    const state = createState({ deps: makeDeps() });
    expect(state.getState()).toEqual({});
  });

  it("loads existing state.json content", () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue(
      JSON.stringify({ app: { uuid: "abc-123" } }),
    );
    const state = createState({ deps });
    expect(state.getState()).toEqual({ app: { uuid: "abc-123" } });
  });

  it("falls back to empty state when state.json is malformed", () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue("{not json");
    const state = createState({ deps });
    expect(state.getState()).toEqual({});
    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("updateState deep merges into the in-memory state", () => {
    const state = createState({ deps: makeDeps() });
    state.updateState({ app: { uuid: "abc-123" } });
    state.updateState({ app: { identifier: "my-app" } });
    expect(state.getState()).toEqual({
      app: { uuid: "abc-123", identifier: "my-app" },
    });
  });

  it("saveState writes the current state to .bbs/state.json", () => {
    const deps = makeDeps();
    const state = createState({ deps });
    state.updateState({ app: { uuid: "abc-123" } });
    state.saveState();
    const expectedPath = path.resolve(process.cwd(), ".bbs", "state.json");
    expect(deps.director.writeFile).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify({ app: { uuid: "abc-123" } }, null, 2),
    );
  });
});
