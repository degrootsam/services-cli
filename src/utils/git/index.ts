import path from "path";
import semver from "semver";
import { director, logger, prompter } from "..";

export type GitTemplateConfig = {
  name: string;
  path: string;
  version?: string; // "latest" (default) or a specific tag
};

export default class Git {
  private readonly repoPath: string;
  private readonly name: string;
  private readonly version: string;

  constructor(config: GitTemplateConfig) {
    this.name = config.name;
    this.repoPath = path.resolve(config.path);
    this.version = config.version ?? "latest";
  }

  async getLatestRemoteTag(): Promise<string | null> {
    logger.debug(
      `[${this.name}] Getting latest remote tag for: ${this.repoPath}`,
    );
    try {
      await director.runCommand("git", ["fetch", "--tags"], {
        cwd: this.repoPath,
      });

      const tagsOutput = await director.runCommand("git", ["tag"], {
        cwd: this.repoPath,
      });

      const tags = tagsOutput
        .split("\n")
        .map((tag) => tag.trim())
        .filter((tag) => semver.valid(tag))
        .sort(semver.rcompare);

      return tags[0] ?? null;
    } catch (err) {
      logger.error(`[${this.name}] Failed to get remote tags:`, err);
      return null;
    }
  }

  async getCurrentTag(): Promise<string | null> {
    try {
      const tag = await director.runCommand(
        "git",
        ["describe", "--tags", "--abbrev=0"],
        {
          cwd: this.repoPath,
        },
      );
      return semver.valid(tag) ? tag : null;
    } catch {
      return null;
    }
  }

  async checkForUpdate(): Promise<
    | { updateAvailable: true; currentVersion: string; latestVersion: string }
    | { updateAvailable: false }
  > {
    if (this.version !== "latest") {
      return { updateAvailable: false }; // always "update" if version is pinned
    }

    try {
      const latestVersion = await this.getLatestRemoteTag();
      const currentVersion = await this.getCurrentTag();

      const currentSemver = currentVersion
        ? semver.coerce(currentVersion)
        : semver.parse("0.0.0");
      const latestSemver = latestVersion ? semver.coerce(latestVersion) : null;

      const updateAvailable =
        !!latestSemver && semver.gt(latestSemver, currentSemver!);

      if (updateAvailable) {
        return {
          updateAvailable: true,
          currentVersion: currentVersion ?? "0.0.0",
          latestVersion: latestVersion ?? "N/A",
        };
      }
    } catch (err) {
      logger.error(`[${this.name}] Error checking for updates:`, err);
    }

    return { updateAvailable: false };
  }

  private async checkoutVersion(tag: string): Promise<void> {
    const parsedTag = tag.startsWith("v") ? tag : `v${tag}`;
    try {
      logger.debug(`[${this.name}] Cleaning untracked files...`);
      await director.runCommand("git", ["clean", "-fd"], {
        cwd: this.repoPath,
      });

      logger.debug(`[${this.name}] Resetting to HEAD...`);
      await director.runCommand("git", ["reset", "--hard"], {
        cwd: this.repoPath,
      });

      logger.debug(`[${this.name}] Fetching latest tags...`);
      await director.runCommand("git", ["fetch", "--tags", "origin"], {
        cwd: this.repoPath,
      });

      logger.debug(`[${this.name}] Checking out ${parsedTag}...`);
      await director.runCommand("git", ["checkout", parsedTag], {
        cwd: this.repoPath,
      });

      logger.success(`${this.name} is now at ${parsedTag}.`);
    } catch (err) {
      logger.error(`[${this.name}] Failed to checkout ${parsedTag}:`, err);
    }
  }

  async handleUpdate(): Promise<void> {
    if (this.version && this.version !== "latest") {
      logger.debug(`[${this.name}] Using pinned version: ${this.version}`);

      await this.checkoutVersion(this.version);
      return;
    }

    const result = await this.checkForUpdate();
    if (!result.updateAvailable) {
      logger.debug(`[${this.name}] Already up to date.`);
      return;
    }

    const confirm = await prompter.confirm(
      `A newer version (${result.currentVersion} → ${result.latestVersion}) is available for ${this.name}. Do you want to update?`,
      true,
    );

    if (!confirm) return;

    await this.checkoutVersion(result.latestVersion);
  }
}
