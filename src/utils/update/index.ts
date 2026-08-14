import path from "path";
import chalk from "chalk";
import { createGit, compareVersions } from "../git/index.js";
import type { AppDeps } from "../types.js";

export async function checkSubmodulesForUpdate({
  deps,
}: {
  deps: AppDeps;
}): Promise<void> {
  const logUpdate = (
    name: string,
    currentVersion: string = "none",
    newVersion: string,
  ) =>
    deps.logger.info(
      `New version available for ${name}: ${chalk.redBright(currentVersion)} → ${chalk.greenBright(newVersion)}`,
    );

  const cliPath = deps.director.resolveCLIPath();
  const codegenTemplatesPath = path.resolve(
    cliPath,
    deps.config.scaffolder.templates.path,
  );
  const codegenTemplatesVersion =
    deps.config.scaffolder.templates.versions?.templates;
  const codegenTemplatesName = deps.config.scaffolder.templates.name;

  const codegenTemplates = createGit({
    deps,
    cfg: {
      name: codegenTemplatesName,
      path: codegenTemplatesPath,
      version: codegenTemplatesVersion,
    },
  });

  const newCodegenTemplatesVersion =
    await codegenTemplates.checkForNewVersion();

  if (
    compareVersions({
      a: newCodegenTemplatesVersion,
      b: codegenTemplatesVersion ?? "0.0.0",
    }) === 1
  ) {
    logUpdate(
      codegenTemplatesName,
      codegenTemplatesVersion,
      newCodegenTemplatesVersion,
    );
  }

  await deps.director.runCommand("git", ["submodule", "update", "--init"], {
    cwd: codegenTemplatesPath,
  });

  const { ts: tsProject, js: jsProject } =
    deps.config.scaffolder.templates.functions.project;
  const functionVersions = deps.config.scaffolder.templates.versions?.functions;

  const tsGit = createGit({
    deps,
    cfg: {
      name: tsProject.name,
      path: path.resolve(codegenTemplatesPath, tsProject.path),
      version: functionVersions?.ts,
    },
  });
  const newTsVersion = await tsGit.checkForNewVersion();
  if (
    compareVersions({ a: newTsVersion, b: functionVersions?.ts ?? "0.0.0" }) ===
    1
  ) {
    logUpdate(tsProject.name, functionVersions?.ts, newTsVersion);
  }

  const jsGit = createGit({
    deps,
    cfg: {
      name: jsProject.name,
      path: path.resolve(codegenTemplatesPath, jsProject.path),
      version: functionVersions?.js,
    },
  });
  const newJsVersion = await jsGit.checkForNewVersion();
  if (
    compareVersions({ a: newJsVersion, b: functionVersions?.js ?? "0.0.0" }) ===
    1
  ) {
    logUpdate(jsProject.name, functionVersions?.js, newJsVersion);
  }
}

export async function updateSubmodules({
  deps,
}: {
  deps: AppDeps;
}): Promise<void> {
  const cliPath = deps.director.resolveCLIPath();
  const codegenTemplatesPath = path.resolve(
    cliPath,
    deps.config.scaffolder.templates.path,
  );
  const codegenTemplateVersion =
    deps.config.scaffolder.templates.versions?.templates;
  const codegenTemplateName = deps.config.scaffolder.templates.name;

  const codegenGit = createGit({
    deps,
    cfg: {
      name: codegenTemplateName,
      path: codegenTemplatesPath,
      version: codegenTemplateVersion,
    },
  });
  const newCodegenVersion = await codegenGit.handleUpdate();

  if (newCodegenVersion) {
    if (codegenTemplateVersion !== newCodegenVersion) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { templates: newCodegenVersion } },
        },
      });
    }
  } else {
    deps.logger.warn(
      `Unable to retrieve a new version for ${codegenTemplateName}!`,
    );
  }

  await deps.director.runCommand("git", ["submodule", "update", "--init"], {
    cwd: codegenTemplatesPath,
  });

  const { ts: tsProject, js: jsProject } =
    deps.config.scaffolder.templates.functions.project;
  const functionVersions = deps.config.scaffolder.templates.versions?.functions;

  const tsGit = createGit({
    deps,
    cfg: {
      name: tsProject.name,
      path: path.resolve(codegenTemplatesPath, tsProject.path),
      version: functionVersions?.ts,
    },
  });
  const newTsVersion = await tsGit.handleUpdate();

  if (newTsVersion) {
    if (newTsVersion !== functionVersions?.ts) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { functions: { ts: newTsVersion } } },
        },
      });
    }
  } else {
    deps.logger.warn(
      "The submodule bb-generic-actions-typescript did not yield a version!",
    );
  }

  const jsGit = createGit({
    deps,
    cfg: {
      name: jsProject.name,
      path: path.resolve(codegenTemplatesPath, jsProject.path),
      version: functionVersions?.js,
    },
  });
  const newJsVersion = await jsGit.handleUpdate();

  if (newJsVersion) {
    if (newJsVersion !== functionVersions?.js) {
      deps.config.updateConfig({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
      deps.state.updateState({
        scaffolder: {
          templates: { versions: { functions: { js: newJsVersion } } },
        },
      });
    }
  } else {
    deps.logger.warn(
      "The submodule bb-generic-actions did not yield a version!",
    );
  }

  deps.state.saveState();
}
