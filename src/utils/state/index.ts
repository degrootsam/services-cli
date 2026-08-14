import path from "path";
import type { Config } from "../config/types/index.js";
import type { DeepPartial } from "../types.js";
import type { LoggerAPI } from "../logger/index.js";
import type { DirectorAPI } from "../director/index.js";

export type StateData = {
  app?: Partial<Config["app"]>;
  scaffolder?: {
    templates?: {
      versions?: NonNullable<Config["scaffolder"]["templates"]["versions"]>;
    };
  };
};

export type StateDeps = {
  director: DirectorAPI;
  logger: LoggerAPI;
};

export type StateAPI = {
  getState: () => StateData;
  updateState: (partial: DeepPartial<StateData>) => void;
  saveState: () => Promise<void>;
};

function deepMerge(
  target: Record<string, any>,
  source: Record<string, any>,
): Record<string, any> {
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      target[key] = deepMerge(target[key] ?? {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}

export async function createState({
  deps,
}: {
  deps: StateDeps;
}): Promise<StateAPI> {
  const STATE_PATH = path.resolve(process.cwd(), ".bbs", "state.json");
  let _data: StateData = await loadState();

  async function loadState() {
    if (await deps.director.exists(STATE_PATH)) {
      try {
        return JSON.parse(
          (await deps.director.readFile(STATE_PATH)) ?? "{}",
        ) as StateData;
      } catch (err) {
        deps.logger.error(
          "Unable to parse .bbs/state.json! Falling back to empty state.",
        );
        deps.logger.debug(err);
      }
    }
    return {};
  }

  return {
    getState() {
      return _data;
    },
    updateState(partial) {
      deps.logger.debug("Storing new state value", partial);
      _data = deepMerge(_data, partial) as StateData;
    },
    async saveState() {
      deps.logger.debug("Saving state to .bbs/state.json");
      await deps.director.writeFile(STATE_PATH, JSON.stringify(_data, null, 2));
    },
  };
}
