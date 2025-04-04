import { execSync } from "child_process";
import path from "path";
import { director, logger, prompter } from "..";

export async function checkTemplateUpdate(
  templatePath: string,
): Promise<boolean> {
  const fullPath = path.resolve(templatePath);
  logger.debug(`Checking for new versions for submodule ${templatePath}`);

  try {
    // Step 1: Fetch latest remote data
    await director.runCommand("git", ["fetch"], { cwd: fullPath });

    // Step 2: Get local and remote commits
    const localCommit = await director.runCommand(
      "git",
      ["rev-parse", "HEAD"],
      { cwd: templatePath },
    );
    const remoteCommit = await director.runCommand(
      "git",
      ["rev-parse", "origin/main"],
      { cwd: templatePath },
    );

    return localCommit !== remoteCommit;
  } catch (err) {
    console.error(`Error checking updates for ${templatePath}:`, err);
    return false;
  }
}

export async function handleTemplateUpdate() {
  const templatePath = director.resolveCLITemplatePath();
  const templateUpdateAvailable = await checkTemplateUpdate(templatePath);

  if (templateUpdateAvailable) {
    const update = await prompter.confirm(
      "A newer version is available for code-templates. Do you wish to update now?",
      true,
    );
    if (update) {
      try {
        await director.runCommand("git", ["clean", "-fd"], {
          cwd: templatePath,
        });
        await director.runCommand("git", ["reset", "--hard"], {
          cwd: templatePath,
        });
        await director.runCommand("git", [
          "-C",
          templatePath,
          "pull",
          "origin",
          "main",
          "--force",
        ]);
        logger.success("Template updated!");
      } catch (err) {
        logger.error("Failed to update template: ", err);
      }
    }
  }
}
