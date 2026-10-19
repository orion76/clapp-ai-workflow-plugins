import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export interface BoardConfig {
  roots: string[];
  manual: Record<string, string>;
}

export interface ProjectEntry {
  slug: string;
  path: string;
  tasksDir: string;
  source: 'scan' | 'manual';
}

const IGNORED_DIRS = new Set(['node_modules', '.git', '.history', '.angular']);
const SLUG_SEPARATOR = /[^a-z0-9]+/g;

export function expandHome(input: string): string {
  if (input === '~') return homedir();
  if (input.startsWith('~/')) return path.join(homedir(), input.slice(2));
  return input;
}

export function loadConfig(boardDir: string): BoardConfig {
  const file = path.join(boardDir, 'projects.yaml');
  const raw = (parseYaml(fs.readFileSync(file, 'utf8')) ?? {}) as Record<string, unknown>;

  const roots = Array.isArray(raw.roots) ? raw.roots.map(String) : [];

  const manual: Record<string, string> = {};
  if (raw.projects && typeof raw.projects === 'object') {
    for (const [slug, value] of Object.entries(raw.projects as Record<string, unknown>)) {
      if (typeof value === 'string') manual[slug] = value;
    }
  }

  return { roots, manual };
}

function isDirectory(target: string): boolean {
  try {
    return fs.statSync(target).isDirectory();
  } catch {
    return false;
  }
}

function hasTasksDir(dir: string): boolean {
  return isDirectory(path.join(dir, '.opencode', 'tasks'));
}

function scanProjects(root: string, found: Set<string>): void {
  const absolute = path.resolve(expandHome(root));
  if (!isDirectory(absolute)) return;

  if (hasTasksDir(absolute)) found.add(absolute);

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(absolute, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) continue;
    if (IGNORED_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
    scanProjects(path.join(absolute, entry.name), found);
  }
}

function slugify(absolutePath: string, roots: string[]): string {
  let relative: string | null = null;
  for (const root of roots) {
    const absoluteRoot = path.resolve(expandHome(root));
    const rel = path.relative(absoluteRoot, absolutePath);
    if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
      relative = rel;
      break;
    }
  }

  const source = relative ?? path.basename(absolutePath);
  const slug = source
    .toLowerCase()
    .replace(/^@/, '')
    .replace(SLUG_SEPARATOR, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'project';
}

function shortHash(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 6);
}

function makeEntry(absolutePath: string, source: ProjectEntry['source'], roots: string[]): ProjectEntry {
  return {
    slug: slugify(absolutePath, roots),
    path: absolutePath,
    tasksDir: path.join(absolutePath, '.opencode', 'tasks'),
    source,
  };
}

export function collectProjects(boardDir: string): { config: BoardConfig; projects: ProjectEntry[] } {
  const config = loadConfig(boardDir);

  const scanned = new Set<string>();
  for (const root of config.roots) scanProjects(root, scanned);

  const byPath = new Map<string, ProjectEntry>();
  for (const absolutePath of scanned) {
    byPath.set(absolutePath, makeEntry(absolutePath, 'scan', config.roots));
  }
  for (const [slug, target] of Object.entries(config.manual)) {
    const absolutePath = path.resolve(expandHome(target));
    byPath.set(absolutePath, {
      slug,
      path: absolutePath,
      tasksDir: path.join(absolutePath, '.opencode', 'tasks'),
      source: 'manual',
    });
  }

  const used = new Map<string, string>();
  for (const entry of byPath.values()) {
    if (entry.source === 'manual') used.set(entry.slug, entry.path);
  }

  const projects: ProjectEntry[] = [];
  for (const entry of byPath.values()) {
    if (entry.source === 'manual') {
      projects.push(entry);
      continue;
    }
    let slug = entry.slug;
    const takenBy = used.get(slug);
    if (takenBy && takenBy !== entry.path) slug = `${slug}-${shortHash(entry.path)}`;
    used.set(slug, entry.path);
    projects.push({ ...entry, slug });
  }

  projects.sort((a, b) => a.slug.localeCompare(b.slug));
  return { config, projects };
}

export function listTaskIds(project: ProjectEntry): string[] {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(project.tasksDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const ids: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(project.tasksDir, entry.name);
    const hasTodo = fs.existsSync(path.join(dir, '_todo.yml')) || fs.existsSync(path.join(dir, '_todo.md'));
    if (fs.existsSync(path.join(dir, '_task.md')) && hasTodo) {
      ids.push(entry.name);
    }
  }

  return ids.sort();
}
