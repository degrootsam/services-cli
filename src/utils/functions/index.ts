import chalk from "chalk";
import { director, logger } from "..";
import { Functions } from "../types";
import path from "path";

export default class FunctionsUtils {
  getFunctions() {
    const tsConfig = director.getTsConfig();
    const srcPath = tsConfig ? "src" : "functions";
    const srcDirectory = director.readDir(srcPath, true);

    const versionRegexp = new RegExp(
      /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/([^\/]+)\.(json|ts)$/,
    );
    logger.debug(`Using regex to find functions`);
    const functionPaths: string[] = srcDirectory.filter((v: string) => {
      const result = versionRegexp.test(v);
      logger.debug(
        `Regex test result for ${v}: ${result ? chalk.green(result) : chalk.red(result)}`,
      );
      return result;
    });

    logger.debug("Found the following functions", functionPaths);
    const functions = functionPaths.reduce(this.reduceFunctionDirs, {});
    logger.debug("Parsed functions object", functions);

    return functions;
  }

  private reduceFunctionDirs = (
    acc: Functions,
    filePath: string,
  ): Functions => {
    {
      const match = filePath.match(
        /^([A-Za-z0-9_-]+)\/(\d+\.\d+)\/[^\/]+\.(json|ts)$/,
      );

      if (!match) return acc; // Skip if it doesn't match

      const [, funcName, version] = match;

      if (!acc[funcName]) {
        acc[funcName] = {
          versions: [],
          latestVersion: version,
          path: path.resolve("src", filePath.split(funcName)[0], funcName),
        };
      }

      if (!acc[funcName].versions.includes(version)) {
        acc[funcName].versions.push(version);
      }

      // Ensure latestVersion is the highest
      acc[funcName].latestVersion = acc[funcName].versions.sort(
        (a, b) => parseFloat(b) - parseFloat(a),
      )[0];

      return acc;
    }
  };
}
