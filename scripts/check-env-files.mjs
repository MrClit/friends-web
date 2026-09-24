#!/usr/bin/env node
/**
 * Guards against the backend's environment files reaching a public repository.
 *
 * The frontend commits its `.env.*` files: every `VITE_*` value ships in the bundle anyway. The
 * backend's carry real secrets — database credentials, OAuth client secrets, Cloudinary keys — and
 * only `apps/backend/.gitignore` keeps them out. That is one rule in one file, undone by a `git add
 * -f`, a reorganisation of the ignore files, or a copy dropped one directory up. Nothing else would
 * notice, so the property has to be checked mechanically (issue #179).
 *
 * Checks:
 *   1. No `apps/backend/.env*` other than `*.example` is tracked.
 *   2. The four files the backend can load are still ignored, so a regression of `.gitignore` fails
 *      here before there is anything to add.
 */

import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const backendEnvFiles = ['.env', '.env.development', '.env.test', '.env.production'].map(
  (name) => `apps/backend/${name}`,
);

const problems = [];

const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

// 1. Tracked secrets.
const tracked = git('ls-files', '--', 'apps/backend/.env*')
  .split('\n')
  .filter((file) => file && !file.endsWith('.example'));
for (const file of tracked) {
  problems.push(
    `${file} is tracked — it holds secrets and this repository is public.\n    Fix: git rm --cached ${file}`,
  );
}

// 2. Ignore rules. `git check-ignore` exits 1 for a path that is not ignored, so failures are data here.
for (const file of backendEnvFiles) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', file], { cwd: root, stdio: 'ignore' });
  } catch {
    problems.push(`${file} is not ignored — apps/backend/.gitignore no longer covers it.`);
  }
}

if (problems.length) {
  console.error('\nBackend environment files are exposed:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nSee the "Environment" section of .claude/rules/backend.md.\n');
  process.exit(1);
}

console.log('Env files OK — no backend .env tracked, all four ignored.');
