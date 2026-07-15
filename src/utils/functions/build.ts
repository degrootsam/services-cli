import { Glob } from "bun";
import * as fs from "fs";
import path from "path";
import { AppDeps } from "../types";

export async function buildFunctions({
  deps,
  mode = "ts",
  outdir = ".tmp",
  debug = false,
}: {
  deps: AppDeps;
  mode?: "ts" | "js";
  outdir?: string;
  debug?: boolean;
}): Promise<string> {
  deps.logger.debug(
    `Building functions with mode ${mode} in destination ${outdir}`,
  );
  deps.spinner.start("Building functions...");
  const appDir = path.resolve(outdir, "app");
  const functionsOutputDir = path.resolve(appDir, "functions");

  const srcDir = deps.config.srcDir;
  const extension = deps.config.projectExtension;
  const glob = new Glob(`**/*${extension}`);
  const entrypoints = [];

  for (const file of glob.scanSync(srcDir)) {
    if (!file.includes("__tests__")) {
      entrypoints.push(path.join(srcDir, file));
    }
  }
  await Bun.build({
    entrypoints,
    outdir: functionsOutputDir,
    format: "esm",
    target: "node",
    minify: !debug,
  });

  fs.cpSync(srcDir, functionsOutputDir, {
    recursive: true,
    filter: (src) => !src.endsWith(extension),
  });

  const packageSourcePath = path.resolve(process.cwd(), "package.json");
  const packageTargetPath = path.resolve(appDir, "package.json");
  fs.copyFileSync(packageSourcePath, packageTargetPath);

  deps.spinner.success("Functions built successfully");
  return appDir;
}
