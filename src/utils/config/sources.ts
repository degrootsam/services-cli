export type ConfigSource =
  | "default"
  | ".bbs/state.json"
  | "config.json"
  | "bbs.config.ts"
  | "environment";

export type ConfigEntry = {
  key: string;
  value: unknown;
  source: ConfigSource;
};

// { a: { b: 1 } } -> { "a.b": 1 }. Arrays are values, undefined is skipped.
export function flattenConfig(
  value: Record<string, any>,
  prefix = "",
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (child === undefined) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      Object.assign(result, flattenConfig(child, path));
    } else {
      result[path] = child;
    }
  }
  return result;
}

// Remembers which layer last set each key
export function createSourceTracker() {
  const sources: Record<string, ConfigSource> = {};

  return {
    record(layer: Record<string, any>, source: ConfigSource) {
      for (const key of Object.keys(flattenConfig(layer))) {
        sources[key] = source;
      }
    },
    entries(config: Record<string, any>): ConfigEntry[] {
      return Object.entries(flattenConfig(config)).map(([key, value]) => ({
        key,
        value,
        source: sources[key] ?? "default",
      }));
    },
  };
}

export function formatConfigEntries(entries: ConfigEntry[]): string[] {
  const width = Math.max(0, ...entries.map((entry) => entry.key.length));
  return entries.map(
    ({ key, value, source }) =>
      `${key.padEnd(width)} = ${JSON.stringify(value)}  (${source})`,
  );
}
