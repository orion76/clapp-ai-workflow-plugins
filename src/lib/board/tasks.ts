import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { type ProjectEntry } from './registry.js';

export interface TaskMeta {
  id: string;
  title: string;
  done: number;
  total: number;
  active: boolean;
}

const TODO_ITEM = /^\s*[-*]\s*\[[^\]]\]\s+/;
const TODO_DONE = /^\s*[-*]\s*\[[xX]\]\s+/;

/** Item statuses treated as closed when counting a `_todo.yml` plan. */
const CLOSED_STATUSES = new Set(['done', 'cancelled']);

export function readTitle(project: ProjectEntry, id: string): string {
  try {
    const content = fs.readFileSync(path.join(project.tasksDir, id, '_task.md'), 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const heading = trimmed.replace(/^#+\s*/, '').trim();
      return heading.replace(new RegExp(`^${id}\\s*:\\s*`), '').trim() || id;
    }
  } catch {
    // fall through
  }
  return id;
}

function countFromYaml(content: string): { done: number; total: number } {
  const doc = (parseYaml(content) ?? {}) as Record<string, unknown>;
  const items = Array.isArray(doc.items) ? doc.items : [];
  let done = 0;
  let total = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    total++;
    const status = (item as Record<string, unknown>).status;
    if (typeof status === 'string' && CLOSED_STATUSES.has(status)) done++;
  }
  return { done, total };
}

function countFromMarkdown(content: string): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const line of content.split('\n')) {
    if (TODO_ITEM.test(line)) total++;
    if (TODO_DONE.test(line)) done++;
  }
  return { done, total };
}

export function readCounts(project: ProjectEntry, id: string): { done: number; total: number } {
  const dir = path.join(project.tasksDir, id);
  const ymlPath = path.join(dir, '_todo.yml');
  try {
    if (fs.existsSync(ymlPath)) return countFromYaml(fs.readFileSync(ymlPath, 'utf8'));
  } catch {
    // fall through to the legacy markdown checklist
  }
  try {
    return countFromMarkdown(fs.readFileSync(path.join(dir, '_todo.md'), 'utf8'));
  } catch {
    return { done: 0, total: 0 };
  }
}

export function isActive(project: ProjectEntry, id: string): boolean {
  const activeLink = path.join(project.path, '.opencode', '_task.md');
  const taskFile = path.join(project.tasksDir, id, '_task.md');
  try {
    return fs.realpathSync(activeLink) === fs.realpathSync(taskFile);
  } catch {
    return false;
  }
}

export function readTaskMeta(project: ProjectEntry, id: string): TaskMeta {
  const { done, total } = readCounts(project, id);
  return { id, title: readTitle(project, id), done, total, active: isActive(project, id) };
}

export function isClosed(meta: TaskMeta): boolean {
  return meta.total > 0 && meta.done === meta.total;
}
