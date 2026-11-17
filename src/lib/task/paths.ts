import { join } from 'node:path';

export function tasksDirectory(projectRoot: string): string {
  return join(projectRoot, '.opencode', 'tasks');
}

export function taskDirectory(projectRoot: string, id: string): string {
  return join(tasksDirectory(projectRoot), id);
}

export function taskHeaderFile(projectRoot: string, id: string): string {
  return join(taskDirectory(projectRoot, id), '_task.md');
}

export function taskPlanFile(projectRoot: string, id: string): string {
  return join(taskDirectory(projectRoot, id), '_todo.yml');
}

/** Symlink of the active task; it is absent while the project has none. */
export function activeTaskLink(projectRoot: string): string {
  return join(projectRoot, '.opencode', '_task.md');
}

/** Symlink of the plan of the active task, paired with `activeTaskLink`. */
export function activeTodoLink(projectRoot: string): string {
  return join(projectRoot, '.opencode', '_todo.yml');
}
