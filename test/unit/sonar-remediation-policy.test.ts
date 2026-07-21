import { readFileSync } from 'node:fs';
import { describe, expect, it } from '@jest/globals';

const installWorkflows = [
  '.github/workflows/ci.yml',
  '.github/workflows/docs.yml',
  '.github/workflows/npm-initial-publish.yml',
  '.github/workflows/release.yml'
];

describe('Sonar security remediation policy', () => {
  it.each(installWorkflows)(
    '%s installs with scripts disabled before the explicit allowlist rebuild',
    (path) => {
      const workflow = readFileSync(path, 'utf8');
      for (const line of workflow
        .split('\n')
        .filter((entry) => entry.includes('npm ci'))) {
        expect(line).toContain('--ignore-scripts');
      }
      expect(workflow).toContain('npm run install:approved-scripts');
    }
  );

  it('keeps Docker dependency installation on the same allowlisted path', () => {
    const dockerfile = readFileSync('Dockerfile', 'utf8');

    expect(dockerfile).toContain('npm ci --ignore-scripts');
    expect(dockerfile).toContain('npm run install:approved-scripts');
    expect(dockerfile).toContain('ARG NODE_IMAGE_RELEASE=24-bookworm-slim');
    expect(dockerfile).toContain('FROM node@${NODE_IMAGE_DIGEST} AS build');
    expect(dockerfile).toContain('FROM node@${NODE_IMAGE_DIGEST} AS runtime');
    expect(dockerfile).not.toMatch(/FROM\s+\S+:\S+@sha256:/);
  });

  it('does not install workflow security tools through mutable Go module resolution', () => {
    const workflow = readFileSync('.github/workflows/security.yml', 'utf8');

    expect(workflow).not.toContain('go install ');
    expect(workflow).toContain('gh release download');
    expect(workflow).toContain('sha256sum --check');
  });

  it('downloads the MCP publisher through a pinned GitHub release and verifies it', () => {
    const workflow = readFileSync(
      '.github/workflows/publish-mcp-registry.yml',
      'utf8'
    );

    expect(workflow).not.toContain('curl -fsSL');
    expect(workflow).toContain('gh release download');
    expect(workflow).toContain('sha256sum --check');
  });
});
