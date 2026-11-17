import type { Dirent } from 'node:fs';
import { access, readdir } from 'node:fs/promises';

import { isTaskActive } from './activity.js';
import { readTaskHeader } from './header.js';
import { taskHeaderFile, tasksDirectory } from './paths.js';
import { countPlanItems, readTodo } from './plan.js';
import type { ITaskItemRow, ITaskMeta, ITaskPlanItem, ITaskSelectionCriteria } from './types.js';

/**
 * Lists the tasks of a project, sorted by id.
 *
 * A task is a directory of `.opencode/tasks/` that carries `_task.md`; a project without the
 * directory, or with a directory of no tasks, reads as an empty list rather than an error.
 * @param projectRoot Root of the project the tasks belong to
 * @returns Tasks of the project with the metrics of their plans and their activity
 */
export async function listTasks(projectRoot: string): Promise<ITaskMeta[]> {
  const ids = await listTaskIds(projectRoot);
  const tasks: ITaskMeta[] = [];

  for (const id of ids) {
    tasks.push(await readTask(projectRoot, id));
  }

  return tasks;
}

/**
 * Reads one task: the header of its `_task.md`, the metrics of its plan and its activity.
 * @param projectRoot Root of the project the task belongs to
 * @param id Id of the task, the name of its directory
 * @returns Task with the metrics of its plan and its activity
 */
export async function readTask(projectRoot: string, id: string): Promise<ITaskMeta> {
  const header = await readTaskHeader(projectRoot, id);
  const plan = await readTodo(projectRoot, id);
  const { done, total } = countPlanItems(plan.items);
  const active = await isTaskActive(projectRoot, id);

  return { ...header, done, total, active };
}

/**
 * Lists the plan items of the tasks of a project, in task order and in plan order.
 *
 * The criteria are combined with AND. `active` narrows the tasks the items come from, the other
 * criteria narrow the items themselves; a criterion that matches nothing yields an empty list.
 * @param projectRoot Root of the project the tasks belong to
 * @param criteria Narrowing of the selection, every criterion optional
 * @returns Plan items, each with the id of the task whose plan carries it
 */
export async function listTaskItems(projectRoot: string, criteria: ITaskSelectionCriteria): Promise<ITaskItemRow[]> {
  const ids = await listTaskIds(projectRoot);
  const rows: ITaskItemRow[] = [];

  for (const id of ids) {
    if (!(await matchesActivity(projectRoot, id, criteria.active))) continue;

    const plan = await readTodo(projectRoot, id);
    for (const item of plan.items) {
      if (matchesCriteria(item, criteria)) rows.push({ task: id, ...item });
    }
  }

  return rows;
}

async function listTaskIds(projectRoot: string): Promise<string[]> {
  let entries: Dirent[];
  try {
    entries = await readdir(tasksDirectory(projectRoot), { withFileTypes: true });
  } catch {
    return [];
  }

  const ids: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (!(await hasTaskHeader(projectRoot, entry.name))) continue;
    ids.push(entry.name);
  }

  return ids.sort();
}

async function hasTaskHeader(projectRoot: string, id: string): Promise<boolean> {
  try {
    await access(taskHeaderFile(projectRoot, id));
    return true;
  } catch {
    return false;
  }
}

async function matchesActivity(projectRoot: string, id: string, active?: boolean): Promise<boolean> {
  if (active === undefined) return true;
  return (await isTaskActive(projectRoot, id)) === active;
}

function matchesCriteria(item: ITaskPlanItem, criteria: ITaskSelectionCriteria): boolean {
  if (criteria.status !== undefined && item.status !== criteria.status) return false;
  if (criteria.group !== undefined && item.group !== criteria.group) return false;
  if (criteria.executor !== undefined && item.executor !== criteria.executor) return false;
  return true;
}
