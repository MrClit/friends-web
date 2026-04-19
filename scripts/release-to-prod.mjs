#!/usr/bin/env node
/* eslint-disable no-undef */

import { execSync } from 'child_process';

const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  error: (msg) => console.error(`❌ ${msg}`),
  warn: (msg) => console.warn(`⚠️  ${msg}`),
};

const exec = (cmd, options = {}) => {
  try {
    return execSync(cmd, { stdio: 'pipe', encoding: 'utf-8', ...options });
  } catch (error) {
    log.error(`Command failed: ${cmd}`);
    log.error(error.message);
    process.exit(1);
  }
};

const main = async () => {
  try {
    log.info('🚀 Starting production release (develop → main)...');

    // 1. Check for uncommitted changes
    log.info('Checking for uncommitted changes...');
    const status = exec('git status --porcelain --untracked-files=no').trim();
    if (status) {
      log.error('You have uncommitted changes. Please commit or stash them first.');
      console.log(status);
      process.exit(1);
    }
    log.success('No uncommitted changes');

    // 2. Get current branch (for restoration)
    const currentBranch = exec('git rev-parse --abbrev-ref HEAD').trim();
    log.info(`Current branch: ${currentBranch}`);

    // 3. Fetch latest changes
    log.info('Fetching latest changes from remote...');
    exec('git fetch origin');
    log.success('Fetched latest changes');

    // 4. Checkout main
    log.info('Checking out main branch...');
    exec('git checkout main');
    log.success('Checked out main');

    // 5. Pull main
    log.info('Pulling main from origin...');
    exec('git pull origin main');
    log.success('Pulled main');

    // 6. Merge develop
    log.info('Merging develop into main...');
    try {
      exec('git merge origin/develop --no-edit');
      log.success('Merged develop into main');
    } catch {
      log.error('Merge conflict detected! Aborting merge...');
      exec('git merge --abort');
      if (currentBranch !== 'main') {
        exec(`git checkout ${currentBranch}`);
      }
      process.exit(1);
    }

    // 7. Push main
    log.info('Pushing main to origin...');
    exec('git push origin main');
    log.success('Pushed main to origin');

    // 8. Return to original branch
    if (currentBranch !== 'main') {
      log.info(`Returning to ${currentBranch}...`);
      exec(`git checkout ${currentBranch}`);
    }

    log.success('🎉 Production release completed successfully!');
    log.info('The deployment should be triggered by GitHub Actions on the main branch.');
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
  }
};

main();
