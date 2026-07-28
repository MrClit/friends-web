#!/usr/bin/env node
/**
 * Guards the wiring between vendored skills and the ones Claude Code actually loads.
 *
 * Vendored skills live in `.agents/skills/` (managed by the skills CLI, tracked in
 * `skills-lock.json`). Claude Code does not scan that path: each one is exposed through a
 * symlink in `.claude/skills/`. A skill without its symlink fails silently — no error, it
 * simply does not exist for the agent — so the mismatch has to be caught mechanically.
 *
 * Checks:
 *   1. Every directory in `.agents/skills/` has a symlink in `.claude/skills/` resolving to it.
 *   2. No symlink in `.claude/skills/` is left dangling.
 *   3. `skills-lock.json` lists exactly what is on disk.
 *   4. No two skills declare the same `name:` in their frontmatter (a collision means one
 *      of them shadows the other at load time).
 */

import { readFileSync, readdirSync, existsSync, lstatSync, realpathSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const vendoredDir = join(root, '.agents/skills');
const loadedDir = join(root, '.claude/skills');
const lockFile = join(root, 'skills-lock.json');

const problems = [];

const dirsIn = (path) =>
  existsSync(path)
    ? readdirSync(path, { withFileTypes: true })
        .filter((e) => e.isDirectory() || e.isSymbolicLink())
        .map((e) => e.name)
        .sort()
    : [];

const vendored = dirsIn(vendoredDir);
const loaded = dirsIn(loadedDir);

// 1 + 2. Symlink wiring.
for (const name of vendored) {
  const link = join(loadedDir, name);
  if (!existsSync(link)) {
    problems.push(
      `.agents/skills/${name} has no symlink in .claude/skills/ — it will never load.\n` +
        `    Fix: ln -s ../../.agents/skills/${name} .claude/skills/${name}`
    );
    continue;
  }
  if (!lstatSync(link).isSymbolicLink()) {
    problems.push(`.claude/skills/${name} is a real directory, not a symlink — it will drift.`);
    continue;
  }
  if (realpathSync(link) !== realpathSync(join(vendoredDir, name))) {
    problems.push(`.claude/skills/${name} does not resolve to .agents/skills/${name}.`);
  }
}

for (const name of loaded) {
  const link = join(loadedDir, name);
  // existsSync follows the link, so it is false exactly when the target is gone.
  // realpathSync would throw here instead of reporting, so it must not be used.
  if (lstatSync(link).isSymbolicLink() && !existsSync(link)) {
    problems.push(
      `.claude/skills/${name} is a dangling symlink — its target under .agents/skills/ is gone.\n` +
        `    Fix: remove the symlink, or reinstall the skill.`
    );
  }
}

// 3. Lock file parity.
if (existsSync(lockFile)) {
  const locked = Object.keys(JSON.parse(readFileSync(lockFile, 'utf8')).skills ?? {}).sort();
  const missingOnDisk = locked.filter((n) => !vendored.includes(n));
  const missingInLock = vendored.filter((n) => !locked.includes(n));
  if (missingOnDisk.length) {
    problems.push(`skills-lock.json lists skills absent from disk: ${missingOnDisk.join(', ')}`);
  }
  if (missingInLock.length) {
    problems.push(`On disk but absent from skills-lock.json: ${missingInLock.join(', ')}`);
  }
}

// 4. Frontmatter name collisions.
const declared = new Map();
for (const name of loaded) {
  const skillFile = join(loadedDir, name, 'SKILL.md');
  if (!existsSync(skillFile)) continue;
  const match = readFileSync(skillFile, 'utf8').match(/^name:\s*(.+)$/m);
  if (!match) continue;
  const declaredName = match[1].trim();
  if (declared.has(declaredName)) {
    problems.push(
      `${name} and ${declared.get(declaredName)} both declare name "${declaredName}" — one shadows the other.`
    );
  } else {
    declared.set(declaredName, name);
  }
}

if (problems.length) {
  console.error('\nSkill wiring is broken:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nSee the "Skills" section of CLAUDE.md.\n');
  process.exit(1);
}

console.log(`Skills OK — ${vendored.length} vendored + ${loaded.length - vendored.length} local, all loadable.`);
