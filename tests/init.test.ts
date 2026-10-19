import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { buildInitResultData, initProject } from '../src/lib/opencode/init.js';

describe('buildInitResultData', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clapp-ai-init-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('reports created artifacts on a fresh directory', () => {
    const data = buildInitResultData(initProject(targetDir));

    expect(data.title).toBe(`Initialized opencode artifacts in ${targetDir}`);
    expect(data.pairs?.map((pair) => pair.key)).toEqual(['config', 'skills', 'commands', 'agents', 'file']);
    expect(data.pairs?.find((pair) => pair.key === 'config')?.value).toContain('(created)');
    expect(data.pairs?.find((pair) => pair.key === 'file')?.value).toContain('(created)');
  });

  it('reports existing artifacts on a repeated run', () => {
    initProject(targetDir);
    const data = buildInitResultData(initProject(targetDir));

    expect(data.pairs?.find((pair) => pair.key === 'config')?.value).toContain('(existing)');
    expect(data.pairs?.find((pair) => pair.key === 'file')?.value).toContain('(existing)');
  });
});
