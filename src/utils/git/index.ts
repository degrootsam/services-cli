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
  private readonly version: string | undefined;

  constructor(config: GitTemplateConfig) {
    this.name = config.name;
    this.repoPath = path.resolve(config.path);
    this.version = config.version;
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

  async getAvailableRemoteTags(): Promise<string[]> {
    logger.debug("Getting available remote tags");
    const tagsOutput = await director.runCommand(
      "git",
      ["ls-remote", "--tags", "origin"],
      { cwd: this.repoPath },
    );

    const tags = tagsOutput
      .split("\n")
      .map((line) => {
        const ref = line.split("\t")[1];
        return ref?.match(/refs\/tags\/(.+?)(\^\{\})?$/)?.[1] ?? null;
      })
      .filter(
        (tag): tag is string => Boolean(tag) && Boolean(semver.valid(tag)),
      )
      .sort(semver.rcompare);

    logger.debug({ tags });

    return tags;
  }

  async getSafeVersion(targetVersion: string): Promise<string | null> {
    const remoteTags = await this.getAvailableRemoteTags();

    if (remoteTags.includes(targetVersion)) {
      return targetVersion; // we're good
    }

    logger.warn(
      `[${this.name}] Version ${targetVersion} not found on remote. Downgrading...`,
    );

    return remoteTags[0] ?? null;
  }

  parseTag(tag: string) {
    const normalized = tag.replaceAll("^", "");
    const version = normalized.startsWith("v") ? normalized : `v${normalized}`;
    return version;
  }

  private async checkoutVersion(tag: string): Promise<void> {
    const parsedTag = this.parseTag(tag);

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

  static compareVersions(a: string, b: string = "0.0.0") {
    const cleanA = semver.clean(a);
    const cleanB = semver.clean(b);
    logger.debug(`Comparing version a: ${cleanA} with version: b ${cleanB}`);
    return semver.compare(semver.clean(a) ?? "", semver.clean(b) ?? "");
  }

  async checkForNewVersion(): Promise<string> {
    const remoteTags = await this.getAvailableRemoteTags();
    const resolvedVersion = remoteTags[0] ?? null;
    if (!resolvedVersion) {
      throw new Error(
        `Unable to fetch latest version from GitHub for ${this.name}`,
      );
    }
    return resolvedVersion;
  }

  async handleUpdate(): Promise<string | null> {
    let resolvedVersion: string | null;

    const remoteTags = await this.getAvailableRemoteTags();

    if (!this.version) {
      logger.warn(
        `[${this.name}] No version specified. Defaulting to latest available version.`,
      );
      resolvedVersion = remoteTags[0] ? `^${remoteTags[0]}` : null;
    } else if (this.version.startsWith("^")) {
      const versionRange = this.version;
      logger.debug(
        `[${this.name}] Looking for highest version matching range: ${versionRange}`,
      );

      const matching = remoteTags
        .filter((tag) => semver.satisfies(tag, versionRange))
        .sort(semver.rcompare);

      resolvedVersion = matching[0] ?? null;

      if (!resolvedVersion) {
        logger.warn(
          `[${this.name}] No versions match range "${versionRange}". Falling back to latest available.`,
        );
        resolvedVersion = remoteTags[0] ?? null;
      }
      resolvedVersion = `^${resolvedVersion}`;
    } else {
      // exact version requested
      const exactMatch = remoteTags.includes(this.version);
      resolvedVersion = exactMatch ? this.version : (remoteTags[0] ?? null);

      if (!exactMatch) {
        logger.warn(
          `[${this.name}] Requested version "${this.version}" not found. Falling back to latest: ${resolvedVersion}`,
        );
      }
    }

    if (!resolvedVersion) {
      logger.error(
        `[${this.name}] No valid versions available. Cannot update.`,
      );
      return null;
    }

    if (resolvedVersion === this.version) {
      return resolvedVersion;
    }

    await this.checkoutVersion(resolvedVersion);
    return resolvedVersion.replaceAll("v", "");
  }
}
