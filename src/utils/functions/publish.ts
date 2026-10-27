import path from "path";
import type { AppDeps } from "../types.js";
import { buildFunctions } from "./build.js";
import { generateFunctionsBarrelFile } from "./gen/barrel.js";
import { getFunctions, getValidFunctions } from "./get.js";
import { uploadFunctions } from "./upload.js";
import { validateFunctions } from "./validate.js";

export async function publishFunctions({ deps }: { deps: AppDeps }) {
  const appDir = path.resolve(deps.config.buildDir, "app");
  const projectType = await deps.director.getProjectType();

  const functions = await getFunctions({ deps, type: projectType });
  const validatedFunctions = await validateFunctions({
    deps,
    functions,
    type: projectType,
  });
  const validFunctions = getValidFunctions({
    functions: validatedFunctions,
  });

  await generateFunctionsBarrelFile({
    deps,
    outputDir: appDir,
    functions: validFunctions,
    fileType: "js",
  });

  await buildFunctions({
    deps,
    outdir: deps.config.buildDir,
    debug: true,
    type: projectType,
  });

  const outputZipPath = path.resolve(deps.config.buildDir, "app.zip");
  await deps.director.zipDir(appDir, outputZipPath);

  await deps.director.removeDir(appDir);

  await uploadFunctions({
    deps,
    zipPath: outputZipPath,
    functions: validFunctions,
  });
}
