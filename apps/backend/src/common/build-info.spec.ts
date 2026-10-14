import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { getBuildInfo, readBuildInfo, UNKNOWN } from './build-info';

// Read rather than hard-coded, so the test does not break on every release.
const rootVersion = (
  JSON.parse(readFileSync(join(__dirname, '../../../../package.json'), 'utf8')) as { version: string }
).version;

describe('build info', () => {
  it('takes the version from the root package.json, not from the backend manifest', () => {
    expect(readBuildInfo({}).version).toBe(rootVersion);
    expect(rootVersion).not.toBe('0.0.0');
  });

  it('reports an unknown version when no root manifest is found above the start directory', () => {
    const dir = mkdtempSync(join(tmpdir(), 'build-info-'));
    try {
      expect(readBuildInfo({}, dir).version).toBe(UNKNOWN);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("takes the commit from Render's variable", () => {
    expect(readBuildInfo({ RENDER_GIT_COMMIT: 'abc123' }).commit).toBe('abc123');
  });

  it("falls back to Railway's variable", () => {
    expect(readBuildInfo({ RAILWAY_GIT_COMMIT_SHA: 'def456' }).commit).toBe('def456');
  });

  it('reports an unknown commit outside a hosting platform', () => {
    expect(readBuildInfo({}).commit).toBe(UNKNOWN);
    expect(readBuildInfo({ RENDER_GIT_COMMIT: '' }).commit).toBe(UNKNOWN);
  });

  it('computes the build info once', () => {
    expect(getBuildInfo()).toBe(getBuildInfo());
  });
});
