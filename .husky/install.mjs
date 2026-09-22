#!/usr/bin/env node
/**
 * Installs the git hooks after `pnpm install`, except where hooks are pointless or harmful.
 *
 * Husky is a root devDependency, so a plain `"prepare": "husky"` is only as safe as the assumption
 * that every install brings devDependencies with it. Render builds the backend with
 * `pnpm install --frozen-lockfile` and `NODE_ENV=production`; the day that install stops installing
 * husky — an `.npmrc`, a `--prod` added to the build command, a pnpm default that changes — the
 * `prepare` script fails and the deploy fails with it. GitHub Actions is the mirror image:
 * installing hooks on a runner that never commits is pure noise.
 *
 * The guard must run *before* the import, not after. Without devDependencies the `husky` package
 * does not exist, and a static import would throw while the module graph is being resolved — long
 * before any check could decide to skip. Hence the dynamic import below.
 */

if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') {
  console.log('Git hooks skipped — NODE_ENV=production or CI=true.');
  process.exit(0);
}

const { default: husky } = await import('husky');

// husky() neither throws nor exits: it returns '' on success, or the reason it gave up (no .git, no
// git binary, HUSKY=0). A missing hook is silent by nature, so the reason has to be printed.
const reason = husky();

if (reason) {
  console.log(`Git hooks not installed — ${reason}.`);
} else {
  console.log('Git hooks installed — pre-push runs lint, tests and build.');
}
