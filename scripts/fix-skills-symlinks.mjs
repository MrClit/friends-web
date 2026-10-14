#!/usr/bin/env node
/**
 * Repairs the skill symlinks in `.claude/skills/` of a clone made with `core.symlinks=false`.
 *
 * With that setting (Git for Windows' installer default when "Enable symbolic links" is left
 * unticked) git checks every symlink out as a plain text file holding the link target, so the
 * vendored skills stop loading. The setting lives in `.git/config` and the damage happens during
 * `clone`, so it cannot be prevented from the repo — only repaired, which is what this does:
 *
 *   1. Finds the entries of `.claude/skills/` that are symlinks in the index (mode 120000) but a
 *      plain file on disk whose content is exactly the link target. Anything else is left alone.
 *   2. Checks this system can create symlinks at all, and aborts untouched if it cannot.
 *   3. Sets `core.symlinks=true` in this clone's local config only, and recreates those entries
 *      from the index. The index already holds them as symlinks, so nothing is left to commit.
 *
 * Explicit by design: it only runs when invoked (`pnpm fix:skills`). On a healthy clone — any
 * Linux or macOS one — it finds nothing to fix and changes nothing.
 */

import { spawnSync, execFileSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const checkScript = join(root, 'scripts/check-skills-symlinks.mjs');

const git = (...args) => execFileSync('git', args, { cwd: root });

// 1. Symlinks in the index that were checked out as plain files.
const broken = [];
const skipped = [];
for (const entry of git('ls-files', '-s', '-z', '--', '.claude/skills').toString().split('\0')) {
  // Format: "<mode> <sha> <stage>\t<path>".
  const match = entry.match(/^120000 ([0-9a-f]+) \d\t(.+)$/);
  if (!match) continue;
  const [, sha, path] = match;
  const file = join(root, path);
  let stat;
  try {
    stat = lstatSync(file);
  } catch {
    continue; // Missing entirely: check:skills reports it with its own fix.
  }
  if (!stat.isFile()) continue;
  if (!readFileSync(file).equals(git('cat-file', 'blob', sha))) {
    skipped.push(path);
    continue;
  }
  broken.push(path);
}

for (const path of skipped) {
  console.error(`  Skipping ${path}: it is not just the link target — move its content out and delete it first.`);
}

if (!broken.length) {
  if (skipped.length) process.exit(1);
  console.log('Nothing to fix — skill symlinks are already in place.');
  process.exit(0);
}

// 2. Pre-flight: a symlink git cannot create would leave the clone half repaired.
const probeDir = mkdtempSync(join(tmpdir(), 'fix-skills-'));
try {
  mkdirSync(join(probeDir, 'target'));
  symlinkSync(join(probeDir, 'target'), join(probeDir, 'link'), 'dir');
} catch (error) {
  console.error(
    `\nThis system cannot create symlinks (${error.code ?? error.message}). Nothing was changed.\n` +
      `On Windows, enable Developer Mode (Settings → System → For developers) and run pnpm fix:skills again.\n`,
  );
  process.exit(1);
} finally {
  rmSync(probeDir, { recursive: true, force: true });
}

// 3. Repair: local config only, then recreate the entries from the index.
git('config', '--local', 'core.symlinks', 'true');
for (const path of broken) unlinkSync(join(root, path));
git('checkout', '--', ...broken);
console.log(`Recreated ${broken.length} symlink(s) in .claude/skills/ and set core.symlinks=true for this clone.`);

// Verify: the wiring check passes and the repair left nothing to commit.
const check = spawnSync(process.execPath, [checkScript], { cwd: root, stdio: 'inherit' });
const dirty = git('status', '--porcelain', '--', '.claude/skills').toString().trim();
if (dirty) console.error(`\nThe repair left changes in .claude/skills/:\n${dirty}\n`);
if (check.status !== 0 || dirty || skipped.length) process.exit(1);
