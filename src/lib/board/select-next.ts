import { type ProjectEntry, listTaskIds } from './registry.js';
import { effectiveStatus, readState, type Status } from './state.js';
import { isClosed, readTaskMeta } from './tasks.js';

export function buildStatusMap(boardDir: string, projects: ProjectEntry[]): Map<string, Status> {
  const statuses = new Map<string, Status>();
  for (const project of projects) {
    for (const id of listTaskIds(project)) {
      const state = readState(boardDir, project.slug, id);
      statuses.set(`${project.slug}/${id}`, effectiveStatus(state, isClosed(readTaskMeta(project, id))));
    }
  }
  return statuses;
}

export interface NextTask {
  slug: string;
  taskId: string;
  status: Status;
  blockedBy: string[];
}

export function selectNext(boardDir: string, projects: ProjectEntry[], filterSlug?: string): NextTask | null {
  const statuses = buildStatusMap(boardDir, projects);
  const isDone = (ref: string): boolean => statuses.get(ref) === 'done';

  for (const project of projects) {
    if (filterSlug && project.slug !== filterSlug) continue;
    for (const id of listTaskIds(project)) {
      const state = readState(boardDir, project.slug, id);
      const status = effectiveStatus(state, isClosed(readTaskMeta(project, id)));
      if (status === 'done' || status === 'review') continue;

      const blockedBy = state?.blockedBy ?? [];
      if (blockedBy.some((ref) => !isDone(ref))) continue;

      return { slug: project.slug, taskId: id, status, blockedBy };
    }
  }

  return null;
}
