import path from "path";
import { fileURLToPath } from "url";
import type { DirectorAPI } from "./director/index.js";

// Both src/utils and dist/utils sit two levels below the package root
const PACKAGE_JSON_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../package.json",
);

export function getCLIVersion({ director }: { director: DirectorAPI }): string {
  try {
    const content = director.readFileSync(PACKAGE_JSON_PATH, true);
    return JSON.parse(content).version ?? "unknown";
  } catch {
    return "unknown";
  }
}
