import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  isValidSkillName,
  listSkills,
  parseSkill,
  renderSkill,
  writeSkill,
} from '../src/lib/opencode/skills.js';

describe('isValidSkillName', () => {
  it.each(['git-release', 'a', 'review-pr-2', 'skill123'])('accepts %s', (name) => {
    expect(isValidSkillName(name)).toBe(true);
  });

  it.each(['Bad', '-lead', 'trail-', 'double--hyphen', 'with space', 'under_score', ''])(
    'rejects %s',
    (name) => {
      expect(isValidSkillName(name)).toBe(false);
    },
  );
});

describe('renderSkill / parseSkill', () => {
  it('renders valid frontmatter and round-trips it', () => {
    const markdown = renderSkill({
      name: 'git-release',
      description: 'Create consistent releases and changelogs',
      license: 'MIT',
      compatibility: 'opencode',
      metadata: { audience: 'maintainers' },
      body: '## What I do\n\n- Draft release notes',
    });

    expect(markdown.startsWith('---\n')).toBe(true);
    expect(markdown).toContain('name: "git-release"');

    const parsed = parseSkill(markdown);
    expect(parsed.name).toBe('git-release');
    expect(parsed.description).toBe('Create consistent releases and changelogs');
    expect(parsed.license).toBe('MIT');
    expect(parsed.compatibility).toBe('opencode');
    expect(parsed.metadata).toEqual({ audience: 'maintainers' });
    expect(parsed.body).toContain('## What I do');
  });

  it('throws on invalid name', () => {
    expect(() => renderSkill({ name: 'Bad Name', description: 'x' })).toThrow(/Invalid skill name/);
  });

  it('throws on missing frontmatter', () => {
    expect(() => parseSkill('# no frontmatter')).toThrow(/frontmatter/);
  });
});

describe('writeSkill / listSkills', () => {
  let targetDir: string;

  beforeEach(() => {
    targetDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clapp-ai-'));
  });

  afterEach(() => {
    fs.rmSync(targetDir, { recursive: true, force: true });
  });

  it('writes a skill and lists it', () => {
    const filePath = writeSkill(targetDir, { name: 'git-release', description: 'Releases' });

    expect(fs.existsSync(filePath)).toBe(true);
    expect(filePath).toBe(path.join(targetDir, '.opencode', 'skills', 'git-release', 'SKILL.md'));

    const skills = listSkills(targetDir);
    expect(skills).toHaveLength(1);
    expect(skills[0]).toMatchObject({ name: 'git-release', description: 'Releases', scope: 'project' });
  });

  it('refuses to overwrite without force', () => {
    writeSkill(targetDir, { name: 'git-release', description: 'Releases' });
    expect(() => writeSkill(targetDir, { name: 'git-release', description: 'Other' })).toThrow(/already exists/);

    expect(() =>
      writeSkill(targetDir, { name: 'git-release', description: 'Other' }, { force: true }),
    ).not.toThrow();
  });

  it('returns empty list for unknown dir', () => {
    expect(listSkills(path.join(targetDir, 'missing'))).toEqual([]);
  });
});
