import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { TASK_ID_PATTERN } from './constants.js';
import { activeTaskLink, activeTodoLink, taskDirectory, taskHeaderFile, taskPlanFile } from './paths.js';
import type { ICreateTaskResult } from './types.js';

/**
 * Creates a task in the project: validates the id, writes the task files and reports the paths.
 *
 * The task directory receives `_task.md` without a `**Профиль:**` line and a `_todo.yml` of one
 * group and one item (schema v1). A rejected id or an existing task is reported in the result
 * rather than thrown.
 * @param project Root of the project the task is created in
 * @param taskId Id of the new task, kebab-case
 * @param description Description written into the task header
 * @returns Paths of the created task and whether its links were activated
 */
export async function createTask(
  project: string,
  taskId: string,
  { description }: { description?: string },
): Promise<ICreateTaskResult> {
  if (!TASK_ID_PATTERN.test(taskId)) {
    return failureResult(`Invalid task ID "${taskId}". Must be kebab-case (lowercase with hyphens).`);
  }

  const tasksDir = taskDirectory(project, taskId);
  if (await exists(tasksDir)) {
    return failureResult(`Task "${taskId}" already exists.`);
  }

  await mkdir(tasksDir, { recursive: true });

  const taskMdContent = `# ${taskId}: ${description || 'New task'}

## Цель

## Контекст

## Требования

## Критерии готовности

## Вне рамок
`;
  const taskMdPath = taskHeaderFile(project, taskId);
  await writeFile(taskMdPath, taskMdContent, 'utf8');

  const todoYmlContent = `# ${taskId}: task plan

task: ${taskId}
version: 1

groups:
  - id: а
    title: Схема и правила
    executor: planner
    status: todo
    items:
      - id: а1
        group: а
        text: Зафиксировать схему _todo.yml
        executor: coder
        status: todo
`;

  const todoYmlPath = taskPlanFile(project, taskId);
  await writeFile(todoYmlPath, todoYmlContent, 'utf8');

  const reviewDir = resolve(project, '.opencode', 'review');
  try {
    await mkdir(reviewDir, { recursive: true });
  } catch {
    // the review directory is optional: a project that cannot take it still owns the task
  }

  // The task links of the project are dropped before the result is reported, so that a later
  // write of them starts from nothing; the links themselves are not created here yet.
  await removeActiveLinks(project);

  return {
    success: true,
    taskPath: tasksDir,
    taskMdPath,
    todoYmlPath,
    activated: await hasOpencodeDirectory(project),
    error: undefined,
  };
}

/** Drops the task links of the project, which point at the previously active task. */
async function removeActiveLinks(project: string): Promise<void> {
  const rootTaskMd = activeTaskLink(project);
  const rootTodoYml = activeTodoLink(project);

  if (await exists(rootTaskMd)) await unlink(rootTaskMd);
  if (await exists(rootTodoYml)) await unlink(rootTodoYml);
}

async function hasOpencodeDirectory(project: string): Promise<boolean> {
  return exists(resolve(project, '.opencode'));
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function failureResult(error: string): ICreateTaskResult {
  return { success: false, taskPath: '', taskMdPath: '', todoYmlPath: '', activated: false, error };
}
