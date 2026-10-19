import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export type USkillScope = 'project' | 'global';

export const SKILL_FILE_NAME = 'SKILL.md';
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const SKILL_NAME_MAX_LENGTH = 64;
export const SKILL_DESCRIPTION_MAX_LENGTH = 1024;

export interface ISkillMetadata {
  [key: string]: string;
}

export interface ISkillDefinition {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: ISkillMetadata;
  body?: string;
}

export interface ISkillInfo {
  name: string;
  description: string;
  path: string;
  scope: USkillScope;
}

export function isValidSkillName(name: string): boolean {
  if (typeof name !== 'string') {
    return false;
  }
  if (name.length < 1 || name.length > SKILL_NAME_MAX_LENGTH) {
    return false;
  }
  return SKILL_NAME_PATTERN.test(name);
}

export function assertValidSkillName(name: string): void {
  if (!isValidSkillName(name)) {
    throw new Error(
      `Invalid skill name "${name}". Expected lowercase alphanumeric with single hyphens, 1-${SKILL_NAME_MAX_LENGTH} chars.`,
    );
  }
}

export function isValidSkillDescription(description: string): boolean {
  return (
    typeof description === 'string' && description.length >= 1 && description.length <= SKILL_DESCRIPTION_MAX_LENGTH
  );
}

export function assertValidSkillDescription(description: string): void {
  if (!isValidSkillDescription(description)) {
    throw new Error(`Invalid skill description. Expected 1-${SKILL_DESCRIPTION_MAX_LENGTH} characters.`);
  }
}

function assertValidSkill(definition: ISkillDefinition): void {
  assertValidSkillName(definition.name);
  assertValidSkillDescription(definition.description);
}

export function renderSkill(definition: ISkillDefinition): string {
  assertValidSkill(definition);

  const lines: string[] = ['---'];
  lines.push(`name: ${quote(definition.name)}`);
  lines.push(`description: ${quote(definition.description)}`);
  if (definition.license) {
    lines.push(`license: ${quote(definition.license)}`);
  }
  if (definition.compatibility) {
    lines.push(`compatibility: ${quote(definition.compatibility)}`);
  }
  if (definition.metadata && Object.keys(definition.metadata).length > 0) {
    lines.push('metadata:');
    for (const [key, value] of Object.entries(definition.metadata)) {
      lines.push(`  ${key}: ${quote(value)}`);
    }
  }
  lines.push('---');

  const body = definition.body ?? defaultSkillBody(definition);
  if (body.trim().length > 0) {
    lines.push('');
    lines.push(body.replace(/\s+$/, ''));
  }
  lines.push('');

  return lines.join('\n');
}

function defaultSkillBody(definition: ISkillDefinition): string {
  return [
    '## What I do',
    '',
    `- ${definition.description}`,
    '',
    '## When to use me',
    '',
    `Use this skill when the task is about ${definition.description}.`,
  ].join('\n');
}

function quote(value: string): string {
  return JSON.stringify(value);
}

export function parseSkill(content: string): ISkillDefinition {
  const normalized = content.replace(/^\uFEFF/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(normalized);
  if (!match) {
    throw new Error('Missing YAML frontmatter in skill file.');
  }

  const [, frontmatter, body] = match;
  const result: ISkillDefinition = { name: '', description: '', body: body ?? '' };
  const metadata: ISkillMetadata = {};
  let inMetadata = false;

  for (const rawLine of frontmatter.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+$/, '');
    if (line.trim().length === 0) {
      continue;
    }

    const metadataMatch = /^\s+([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (inMetadata && metadataMatch) {
      metadata[metadataMatch[1]] = unquote(metadataMatch[2]);
      continue;
    }

    const match2 = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match2) {
      inMetadata = false;
      continue;
    }

    const key = match2[1];
    const value = unquote(match2[2]);
    if (key === 'metadata') {
      inMetadata = true;
      continue;
    }

    inMetadata = false;
    if (key === 'name' || key === 'description' || key === 'license' || key === 'compatibility') {
      result[key] = value;
    }
  }

  if (Object.keys(metadata).length > 0) {
    result.metadata = metadata;
  }

  return result;
}

function unquote(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed) as string;
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}

/**
 * Normalize a user-provided scope value: `global`/`project` are accepted as is,
 * anything else (including an omitted option) resolves to `undefined`.
 * @param scope Raw option value from a command
 * @returns Recognized scope or `undefined` when it was not specified
 */
export function resolveSkillScope(scope?: string): USkillScope | undefined {
  return scope === 'global' || scope === 'project' ? scope : undefined;
}

export function getSkillsDir(targetDir: string, scope: USkillScope = 'project'): string {
  if (scope === 'global') {
    return path.join(os.homedir(), '.config', 'opencode', 'skills');
  }
  return path.join(targetDir, '.opencode', 'skills');
}

export function getSkillPath(targetDir: string, name: string, scope: USkillScope = 'project'): string {
  return path.join(getSkillsDir(targetDir, scope), name, SKILL_FILE_NAME);
}

export function writeSkill(
  targetDir: string,
  definition: ISkillDefinition,
  options: { scope?: USkillScope; force?: boolean } = {},
): string {
  const scope = options.scope ?? 'project';
  const skillPath = getSkillPath(targetDir, definition.name, scope);

  if (fs.existsSync(skillPath) && !options.force) {
    throw new Error(`Skill already exists: ${skillPath}. Use --force to overwrite.`);
  }

  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, renderSkill(definition), 'utf8');

  return skillPath;
}

export function readSkill(skillPath: string): ISkillDefinition {
  return parseSkill(fs.readFileSync(skillPath, 'utf8'));
}

export function listSkills(targetDir: string, scope: USkillScope = 'project'): ISkillInfo[] {
  return listSkillsInDir(getSkillsDir(targetDir, scope), scope);
}

export function listAllSkills(targetDir: string): ISkillInfo[] {
  const project = listSkills(targetDir, 'project');
  const global = listSkills(targetDir, 'global');
  return [...project, ...global];
}

function listSkillsInDir(skillsDir: string, scope: USkillScope): ISkillInfo[] {
  if (!fs.existsSync(skillsDir)) {
    return [];
  }

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const result: ISkillInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const skillPath = path.join(skillsDir, entry.name, SKILL_FILE_NAME);
    if (!fs.existsSync(skillPath)) {
      continue;
    }
    try {
      const parsed = readSkill(skillPath);
      result.push({ name: parsed.name || entry.name, description: parsed.description, path: skillPath, scope });
    } catch {
      result.push({ name: entry.name, description: '', path: skillPath, scope });
    }
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}
