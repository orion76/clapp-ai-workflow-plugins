import { readFile } from 'node:fs/promises';

import { TASK_PROFILES } from './constants.js';
import { taskHeaderFile } from './paths.js';
import type { ITaskHeader, UTaskProfile } from './types.js';

/**
 * Reads the header of a task: the title of the H1 without its `<task-id>: ` prefix and the
 * profile declared in `**Профиль:**`.
 *
 * An unreadable `_task.md` reads as a task without a title, so the title falls back to the id —
 * the same answer the board gives for such a task.
 * @param projectRoot Root of the project the task belongs to
 * @param id Id of the task, the name of its directory
 * @returns Header of the task: id and the title it names
 */
export async function readTaskHeader(projectRoot: string, id: string): Promise<ITaskHeader> {
  let content: string;
  try {
    content = await readFile(taskHeaderFile(projectRoot, id), 'utf8');
  } catch {
    return { id, title: id };
  }

  const lines = content.split('\n');
  const title = readTitle(lines, id);
  const profile = readProfile(lines);

  return profile === undefined ? { id, title } : { id, title, profile };
}

/**
 * Reads the title of a task: the first non-empty heading of `_task.md` without the
 * `<task-id>: ` prefix. A heading that names no title, or a document without one, yields the id.
 */
function readTitle(lines: readonly string[], id: string): string {
  const headingLine = lines.find((line) => line.trim().length > 0);
  if (headingLine === undefined) return id;

  const heading = headingLine.trim().replace(/^#+\s*/, '').trim();
  return stripTaskIdPrefix(heading, id) || id;
}

/**
 * Removes the `<task-id>: ` prefix of a heading, keeping the rest of it untouched: the prefix is
 * the task id up to the first colon, and a heading that starts with something else is a title.
 */
function stripTaskIdPrefix(heading: string, id: string): string {
  const separator = heading.indexOf(':');
  if (separator === -1) return heading;

  const prefix = heading.slice(0, separator).trim();
  return prefix === id ? heading.slice(separator + 1).trim() : heading;
}

/** Reads the profile line of `_task.md`; a profile outside `TASK_PROFILES` counts as absent. */
function readProfile(lines: readonly string[]): UTaskProfile | undefined {
  for (const line of lines) {
    const match = /^\*\*Профиль:\*\*\s*(\S+)/.exec(line.trim());
    if (match === null) continue;

    const declared = match[1];
    const profile = TASK_PROFILES.find((candidate) => candidate === declared);
    if (profile !== undefined) return profile;
  }

  return undefined;
}
