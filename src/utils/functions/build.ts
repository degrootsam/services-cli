import * as fs from "fs";
import path from "path";
import { AppDeps } from "../types";
import esbuild from "esbuild";

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
  const srcEntryPoint = `${srcDir}/**/*${deps.config.projectExtension}`;

  switch (mode) {
    case "ts":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".ts"),
      });
      break;
    case "js":
      await esbuild.build({
        entryPoints: [srcEntryPoint],
        outdir: functionsOutputDir,
        platform: "node",
        format: "esm",
        target: "es2022",
        minify: !debug,
      });
      fs.cpSync(srcDir, functionsOutputDir, {
        recursive: true,
        filter: (src) => !src.endsWith(".js"),
      });
      break;
  }

  const packageSourcePath = path.resolve(process.cwd(), "package.json");
  const packageTargetPath = path.resolve(appDir, "package.json");
  fs.copyFileSync(packageSourcePath, packageTargetPath);

  deps.spinner.success("Functions built successfully");
  return appDir;
}
