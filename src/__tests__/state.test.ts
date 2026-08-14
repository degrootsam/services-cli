import { mock, describe, it, expect, Mock } from "bun:test";
import path from "path";
import { createState } from "../utils/state/index.js";
import type { LoggerAPI } from "../utils/logger/index.js";
import type { DirectorAPI } from "../utils/director/index.js";

const makeDeps = () => ({
  director: {
    exists: mock(async () => false),
    readFile: mock(async () => ""),
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
  it("starts empty when .bbs/state.json does not exist", async () => {
    const state = await createState({ deps: makeDeps() });
    expect(state.getState()).toEqual({});
  });

  it("loads existing state.json content", async () => {
    const deps = makeDeps();
    (deps.director.exists as Mock<() => Promise<boolean>>).mockResolvedValue(
      true,
    );
    (deps.director.readFile as Mock<() => Promise<string>>).mockResolvedValue(
      JSON.stringify({ app: { uuid: "abc-123" } }),
    );
    const state = await createState({ deps });
    expect(state.getState()).toEqual({ app: { uuid: "abc-123" } });
  });

  it("falls back to empty state when state.json is malformed", async () => {
    const deps = makeDeps();
    (deps.director.exists as any).mockReturnValue(true);
    (deps.director.readFile as any).mockReturnValue("{not json");
    const state = await createState({ deps });
    expect(state.getState()).toEqual({});
    expect(deps.logger.error).toHaveBeenCalled();
  });

  it("updateState deep merges into the in-memory state", async () => {
    const state = await createState({ deps: makeDeps() });
    state.updateState({ app: { uuid: "abc-123" } });
    state.updateState({ app: { identifier: "my-app" } });
    expect(state.getState()).toEqual({
      app: { uuid: "abc-123", identifier: "my-app" },
    });
  });

  it("saveState writes the current state to .bbs/state.json", async () => {
    const deps = makeDeps();
    const state = await createState({ deps });
    state.updateState({ app: { uuid: "abc-123" } });
    state.saveState();
    const expectedPath = path.resolve(process.cwd(), ".bbs", "state.json");
    expect(deps.director.writeFile).toHaveBeenCalledWith(
      expectedPath,
      JSON.stringify({ app: { uuid: "abc-123" } }, null, 2),
    );
  });
});
