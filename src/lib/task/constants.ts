import type { UTaskItemStatus, UTaskProfile } from './types.js';

/** Statuses a plan item may carry (schema v1), in the order the format lists them. */
export const TASK_ITEM_STATUSES: readonly UTaskItemStatus[] = [
  'todo',
  'in-progress',
  'done',
  'question',
  'deferred',
  'blocked',
  'cancelled',
];

/** Statuses that close a plan item; every other status keeps it open, `deferred` included. */
export const CLOSED_TASK_ITEM_STATUSES: readonly UTaskItemStatus[] = ['done', 'cancelled'];

/** Profiles a task may declare in `**Профиль:**`. */
export const TASK_PROFILES: readonly UTaskProfile[] = ['full', 'normal', 'small'];

/** Shape of a task id: lowercase latin words joined by hyphens. */
export const TASK_ID_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
