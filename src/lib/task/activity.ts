import { realpath } from 'node:fs/promises';

import { activeTaskLink, taskHeaderFile } from './paths.js';

/**
 * Reports whether the project's `.opencode/_task.md` link points at this task.
 *
 * The check compares the resolved targets of the link and of the task header, so it follows the
 * symlink rather than its text. Every failure of that comparison — no link, no `_task.md`, a
 * dangling symlink — answers `false`: an unreadable link means no active task, not an error.
 * @param projectRoot Root of the project the task belongs to
 * @param id Id of the task, the name of its directory
 * @returns `true` when the project link points at this task
 */
export async function isTaskActive(projectRoot: string, id: string): Promise<boolean> {
  try {
    const active = await realpath(activeTaskLink(projectRoot));
    const header = await realpath(taskHeaderFile(projectRoot, id));
    return active === header;
  } catch {
    return false;
  }
}
