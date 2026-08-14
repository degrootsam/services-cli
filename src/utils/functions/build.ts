import { Glob } from "bun";
import * as fs from "fs";
import path from "path";
import { AppDeps } from "../types.js";
import { getFunctions } from "./get.js";

export async function buildFunctions({
  deps,
  outdir = ".tmp",
  debug = false,
}: {
  deps: AppDeps;
  outdir?: string;
  debug?: boolean;
}): Promise<string> {
  const projectType = await deps.director.getProjectType();

  deps.logger.debug(
    `Building functions with mode ${projectType} in destination ${outdir}`,
  );
  deps.spinner.start("Building functions...");

  if (projectType === "wasm") {
    await buildWASMFunctions({ outdir, deps, debug });
  } else {
    await buildJSTSFunctions({ outdir, deps, debug });
  }

  return outdir;
}

async function buildWASMFunctions({
  outdir,
  deps,
  debug,
}: {
  outdir: string;
  deps: AppDeps;
  debug: boolean;
}) {
  const functions = await getFunctions({ deps, type: "wasm" });
  console.log({ functions, length: functions.length });
  const justFile = await deps.director.readFile("Justfile", true);
}

async function buildJSTSFunctions({
  outdir,
  deps,
  debug,
}: {
  outdir: string;
  deps: AppDeps;
  debug: boolean;
}) {
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
