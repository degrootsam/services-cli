import path from "path";
import semver from "semver";
import type { AppDeps } from "../types";

export type GitTemplateConfig = {
  name: string;
  path: string;
  version?: string;
};

export type GitAPI = {
  getLatestRemoteTag: () => Promise<string | null>;
  getCurrentTag: () => Promise<string | null>;
  getAvailableRemoteTags: () => Promise<string[]>;
  checkForNewVersion: () => Promise<string>;
  handleUpdate: () => Promise<string | null>;
};

export function compareVersions({
  a,
  b = "0.0.0",
}: {
  a: string;
  b?: string;
}): number {
  return semver.compare(semver.clean(a) ?? "", semver.clean(b) ?? "");
}

export function createGit({
  deps,
  cfg,
}: {
  deps: AppDeps;
  cfg: GitTemplateConfig;
}): GitAPI {
  const repoPath = path.resolve(cfg.path);
  const { name, version } = cfg;

  return {
    async getLatestRemoteTag() {
      deps.logger.debug(`[${name}] Getting latest remote tag for: ${repoPath}`);
      try {
        await deps.director.runCommand("git", ["fetch", "--tags"], {
          cwd: repoPath,
        });
        const tagsOutput = await deps.director.runCommand("git", ["tag"], {
          cwd: repoPath,
        });
        const tags = tagsOutput
          .split("\n")
          .map((tag) => tag.trim())
          .filter((tag) => semver.valid(tag))
          .sort(semver.rcompare);
        return tags[0] ?? null;
      } catch (err) {
        deps.logger.error(`[${name}] Failed to get remote tags:`, err);
        return null;
      }
    },

    async getCurrentTag() {
      try {
        const tag = await deps.director.runCommand(
          "git",
          ["describe", "--tags", "--abbrev=0"],
          { cwd: repoPath },
        );
        return semver.valid(tag) ? tag : null;
      } catch {
        return null;
      }
    },

    async getAvailableRemoteTags() {
      deps.logger.debug("Getting available remote tags");
      const tagsOutput = await deps.director.runCommand(
        "git",
        ["ls-remote", "--tags", "origin"],
        { cwd: repoPath },
      );
      return tagsOutput
        .split("\n")
        .map((line) => {
          const ref = line.split("\t")[1];
          return ref?.match(/refs\/tags\/(.+?)(\^\{\})?$/)?.[1] ?? null;
        })
        .filter(
          (tag): tag is string => Boolean(tag) && Boolean(semver.valid(tag)),
        )
        .sort(semver.rcompare);
    },

    async checkForNewVersion() {
      const git = createGit({ deps, cfg });
      const remoteTags = await git.getAvailableRemoteTags();
      const resolvedVersion = remoteTags[0] ?? null;
      if (!resolvedVersion) {
        throw new Error(
          `Unable to fetch latest version from GitHub for ${name}`,
        );
      }
      return resolvedVersion;
    },

    async handleUpdate() {
      const git = createGit({ deps, cfg });
      const remoteTags = await git.getAvailableRemoteTags();
      let resolvedVersion: string | null;

      if (!version) {
        deps.logger.warn(
          `[${name}] No version specified. Defaulting to latest available version.`,
        );
        resolvedVersion = remoteTags[0] ? `^${remoteTags[0]}` : null;
      } else if (version.startsWith("^")) {
        const matching = remoteTags
          .filter((tag) => semver.satisfies(tag, version))
          .sort(semver.rcompare);
        resolvedVersion = matching[0] ?? null;
        if (!resolvedVersion) {
          deps.logger.warn(
            `[${name}] No versions match range "${version}". Falling back to latest.`,
          );
          resolvedVersion = remoteTags[0] ?? null;
        }
        resolvedVersion = resolvedVersion ? `^${resolvedVersion}` : null;
      } else {
        const exactMatch = remoteTags.includes(version);
        resolvedVersion = exactMatch ? version : (remoteTags[0] ?? null);
        if (!exactMatch) {
          deps.logger.warn(
            `[${name}] Requested version "${version}" not found. Falling back to: ${resolvedVersion}`,
          );
        }
      }

      if (!resolvedVersion) {
        deps.logger.error(
          `[${name}] No valid versions available. Cannot update.`,
        );
        return null;
      }

      if (resolvedVersion === version) return resolvedVersion;

      // checkout
      try {
        const parsedTag = resolvedVersion.replace("^", "");
        await deps.director.runCommand("git", ["fetch", "--tags"], {
          cwd: repoPath,
        });
        await deps.director.runCommand(
          "git",
          ["checkout", `tags/${parsedTag}`],
          {
            cwd: repoPath,
          },
        );
        deps.spinner.success(`${name} is now at ${parsedTag}.`);
      } catch (err) {
        deps.logger.error(
          `[${name}] Failed to checkout ${resolvedVersion}:`,
          err,
        );
      }

      return resolvedVersion.replaceAll("v", "");
    },
  };
}
