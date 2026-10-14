import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';

/** Name of the root manifest, whose `version` is the product version bumped by each release. */
const ROOT_PACKAGE_NAME = 'friends-monorepo';

export const UNKNOWN = 'unknown';

export interface BuildInfo {
  /** Product version, taken from the root `package.json`. */
  version: string;
  /** Deployed commit SHA, provided by the hosting platform; `unknown` outside of it (local, CI). */
  commit: string;
}

/**
 * Walks up from `startDir` to the root `package.json` and returns its version. The same lookup works
 * from `src/` (tests, dev server) and from `dist/` (production), since every deploy builds from the
 * monorepo root and keeps it on disk.
 */
function readRootVersion(startDir: string): string {
  let dir = startDir;
  while (true) {
    const manifestPath = join(dir, 'package.json');
    if (existsSync(manifestPath)) {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { name?: string; version?: string };
      if (manifest.name === ROOT_PACKAGE_NAME) return manifest.version ?? UNKNOWN;
    }
    const parent = dirname(dir);
    if (parent === dir) return UNKNOWN;
    dir = parent;
  }
}

/**
 * Reads the build info without caching. Render sets `RENDER_GIT_COMMIT`; Railway, under evaluation,
 * sets `RAILWAY_GIT_COMMIT_SHA`.
 */
export function readBuildInfo(env: NodeJS.ProcessEnv = process.env, startDir: string = __dirname): BuildInfo {
  return {
    version: readRootVersion(startDir),
    commit: env.RENDER_GIT_COMMIT || env.RAILWAY_GIT_COMMIT_SHA || UNKNOWN,
  };
}

let cached: BuildInfo | undefined;

/** Build info of the running process, computed once: neither the manifest nor the env change at runtime. */
export function getBuildInfo(): BuildInfo {
  cached ??= readBuildInfo();
  return cached;
}
