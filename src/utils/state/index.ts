import path from "path";
import type { Config } from "../config/types";
import type { DeepPartial } from "../types";
import type { LoggerAPI } from "../logger";
import type { DirectorAPI } from "../director";

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

export function createState({ deps }: { deps: StateDeps }): StateAPI {
  const STATE_PATH = path.resolve(process.cwd(), ".bbs", "state.json");
  let _data: StateData = loadState();

  function loadState() {
    if (deps.director.exists(STATE_PATH)) {
      try {
        return JSON.parse(
          deps.director.readFileSync(STATE_PATH) ?? "{}",
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
