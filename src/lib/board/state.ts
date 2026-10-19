import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';

export const STATUSES = ['todo', 'in-progress', 'review', 'done', 'blocked'] as const;
export type Status = (typeof STATUSES)[number];

export interface TaskState {
  status: Status;
  owner: string | null;
  blockedBy: string[];
  updated: string | null;
  note: string;
}

export function defaultState(): TaskState {
  return { status: 'todo', owner: null, blockedBy: [], updated: null, note: '' };
}

export function isStatus(value: string): value is Status {
  return (STATUSES as readonly string[]).includes(value);
}

export function stateFile(boardDir: string, slug: string, id: string): string {
  return path.join(boardDir, 'state', slug, `${id}.yaml`);
}

function normalize(raw: Record<string, unknown>): TaskState {
  const state = defaultState();
  if (typeof raw.status === 'string' && isStatus(raw.status)) state.status = raw.status;
  if (typeof raw.owner === 'string') state.owner = raw.owner;
  if (Array.isArray(raw.blockedBy)) state.blockedBy = raw.blockedBy.map(String);
  if (typeof raw.updated === 'string') state.updated = raw.updated;
  if (typeof raw.note === 'string') state.note = raw.note;
  return state;
}

export function readState(boardDir: string, slug: string, id: string): TaskState | null {
  try {
    const raw = (parseYaml(fs.readFileSync(stateFile(boardDir, slug, id), 'utf8')) ?? {}) as Record<string, unknown>;
    return normalize(raw);
  } catch {
    return null;
  }
}

export function effectiveStatus(state: TaskState | null, allDone: boolean): Status {
  if (state) return state.status;
  return allDone ? 'done' : 'todo';
}
