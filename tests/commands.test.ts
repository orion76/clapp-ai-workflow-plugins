import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import 'reflect-metadata';

import { getPluginDefinition } from '@orion76/node-plugin';

import { InitCommandPlugin } from '../src/plugins/command/init/init.plugin.js';
import { NpmInfoCommandPlugin } from '../src/plugins/command/npm-info/npm-info.plugin.js';
import { SkillListCommandPlugin } from '../src/plugins/command/skill/list/list.plugin.js';
import { initProject } from '../src/lib/opencode/init.js';
import { writeSkill } from '../src/lib/opencode/skills.js';

describe('command definitions', () => {
  it('declares the formatter of every structural command', () => {
    expect(getPluginDefinition(SkillListCommandPlugin)).toMatchObject({ formatter: 'table' });
    expect(getPluginDefinition(NpmInfoCommandPlugin)).toMatchObject({ formatter: 'key-value' });
    expect(getPluginDefinition(InitCommandPlugin)).toMatchObject({ formatter: 'key-value' });
  });
});

describe('SkillListCommandPlugin', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clapp-ai-cmd-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('returns the project skills as table rows', async () => {
    writeSkill(targetDir, { name: 'git-release', description: 'Releases' });
    const result = await new SkillListCommandPlugin().action({ dir: targetDir, scope: 'project' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      headers: ['name', 'scope', 'description'],
      rows: [{ name: 'git-release', scope: 'project', description: 'Releases' }],
    });
  });

  it('returns empty rows for a directory without skills', async () => {
    const result = await new SkillListCommandPlugin().action({ dir: targetDir, scope: 'project' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ headers: ['name', 'scope', 'description'], rows: [] });
  });
});

describe('NpmInfoCommandPlugin', () => {
  let targetDir: string;
  let previousCwd: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clapp-ai-cmd-'));
    previousCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(previousCwd);
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('returns key-value data for a known type', async () => {
    fs.writeFileSync(
      path.join(targetDir, 'package.json'),
      JSON.stringify({ name: 'demo', version: '1.0.0', scripts: { build: 'tsc' } }),
    );
    process.chdir(targetDir);

    const result = await new NpmInfoCommandPlugin().action({ type: 'scripts' });

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ sections: [{ title: 'scripts (1)', pairs: [{ key: 'build', value: 'tsc' }] }] });
  });

  it('defaults to summary when no type is given', async () => {
    fs.writeFileSync(path.join(targetDir, 'package.json'), JSON.stringify({ name: 'demo', version: '1.0.0' }));
    process.chdir(targetDir);

    const result = await new NpmInfoCommandPlugin().action({});

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ pairs: [{ key: 'name', value: 'demo' }, { key: 'version', value: '1.0.0' }] });
  });

  it('fails without data for an unknown type', async () => {
    const result = await new NpmInfoCommandPlugin().action({ type: 'everything' });

    expect(result.success).toBe(false);
    expect(result.error?.[0]).toContain('Unknown info type: everything');
    expect(result.data).toBeUndefined();
  });

  it('fails without data when package.json is missing', async () => {
    process.chdir(targetDir);

    const result = await new NpmInfoCommandPlugin().action({ type: 'summary' });

    expect(result.success).toBe(false);
    expect(result.error?.[0]).toContain('package.json not found');
    expect(result.data).toBeUndefined();
  });
});

describe('InitCommandPlugin', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clapp-ai-cmd-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('returns the scaffolded artifacts as key-value data', async () => {
    initProject(targetDir);
    const result = await new InitCommandPlugin().action({ dir: targetDir });
    const expected = initProject(targetDir);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      title: `Initialized opencode artifacts in ${targetDir}`,
      pairs: [
        { key: 'config', value: `${expected.configPath} (existing)` },
        { key: 'skills', value: expected.skillsDir },
        { key: 'commands', value: expected.commandsDir },
        { key: 'agents', value: expected.agentsDir },
        { key: 'file', value: `${expected.agentsFilePath} (existing)` },
      ],
    });
  });
});
