import path from "path";
import { AppDeps } from "../index.js";
import { ProjectTypeKey } from "../types.js";
import { createWASMFunction } from "./create.js";
import { generateBbsConfigFile } from "./gen/config.js";
import { downloadTemplate } from "../scaffolder/index.js";

export async function initFunctionsProject({
  name,
  deps,
  type,
}: {
  name: string;
  deps: AppDeps;
  type: ProjectTypeKey;
}) {
  let templateUrl =
    deps.config.scaffolder.templates.functions.project[type].url;

  await downloadTemplate({
    deps,
    url: templateUrl,
    cloneLocation: name,
    force: deps.config.force,
  });

  await generateBbsConfigFile({ deps, targetDir: name });

  deps.director.changeDir(name);

  if (type !== "wasm") {
    deps.spinner.start("Installing dependencies...");
    await deps.director.runCommand("bun", ["install"], {
      stdio: "ignore",
      cwd: path.resolve(name),
    });
    deps.spinner.success("Dependencies installed");
  } else {
    const funcName = await deps.prompter.input(
      "Please enter a name for your first function",
      true,
    );
    await createWASMFunction({
      name: funcName,
      deps,
    });
  }
}
