#!/usr/bin/env node
/**
 * Guards the pnpm catalog that keeps ESLint and TypeScript aligned across workspaces.
 *
 * pnpm bakes the eslint/typescript versions each workspace asks for into the lockfile's
 * peer-dependency keys. When two manifests disagree, the keys come out mixed and the next
 * incremental `pnpm add` leaves `node_modules` unable to lint (issue #211). The catalog in
 * `pnpm-workspace.yaml` declares those versions once, but pnpm does not enforce it: a
 * `pnpm add eslint@<version>` writes a plain range into the manifest and only warns about peers.
 * The stricter `catalogMode` settings would enforce it, at the price of moving every new
 * dependency of the repo into the catalog — hence this check instead.
 *
 * Checks:
 *   1. Every workspace manifest that declares a catalog package declares it as "catalog:".
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(import.meta.url), '../..');
const dependencyFields = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

// The workspace file is tiny and flat, so its `catalog:` block is read by hand rather than adding a
// YAML parser to the root just for this.
const catalog = new Set();
let inCatalog = false;
for (const line of readFileSync(join(root, 'pnpm-workspace.yaml'), 'utf8').split('\n')) {
  if (/^\S/.test(line)) inCatalog = line.trim() === 'catalog:';
  else if (inCatalog) {
    const name = line.match(/^\s+['"]?([^'":\s]+)['"]?\s*:/)?.[1];
    if (name) catalog.add(name);
  }
}

const problems = [];

if (!catalog.size) problems.push('pnpm-workspace.yaml has no `catalog:` entries — the parser here found nothing.');

const manifests = [
  'package.json',
  ...['apps', 'packages'].flatMap((dir) =>
    readdirSync(join(root, dir), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && existsSync(join(root, dir, entry.name, 'package.json')))
      .map((entry) => `${dir}/${entry.name}/package.json`),
  ),
];

// 1. Catalog packages referenced through the catalog.
for (const manifest of manifests) {
  const pkg = JSON.parse(readFileSync(join(root, manifest), 'utf8'));
  for (const field of dependencyFields) {
    for (const [name, spec] of Object.entries(pkg[field] ?? {})) {
      if (catalog.has(name) && spec !== 'catalog:') {
        problems.push(
          `${manifest} declares ${name}@${spec} in ${field}.\n    Fix: set it to "catalog:" and change the version in pnpm-workspace.yaml.`,
        );
      }
    }
  }
}

if (problems.length) {
  console.error('\nWorkspace tooling versions bypass the pnpm catalog:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nSee the comment above `catalog:` in pnpm-workspace.yaml.\n');
  process.exit(1);
}

console.log(`Catalog OK — ${catalog.size} packages, referenced as "catalog:" in ${manifests.length} manifests.`);
