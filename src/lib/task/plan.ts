import { readFile } from 'node:fs/promises';

import { parse as parseYaml } from 'yaml';

import { CLOSED_TASK_ITEM_STATUSES, TASK_ITEM_STATUSES } from './constants.js';
import { taskPlanFile } from './paths.js';
import type { ITaskPlan, ITaskPlanGroup, ITaskPlanItem, UTaskItemStatus } from './types.js';

/**
 * Reads the plan of a task: the `groups` list and the flat `items` list of its `_todo.yml`.
 *
 * A plan the reader cannot use — no file, unreadable file, malformed YAML — reads as an empty
 * plan rather than an error: a task without a plan yet looks exactly like that to a caller.
 * @param projectRoot Root of the project the task belongs to
 * @param id Id of the task, the name of its directory
 * @returns Plan of the task, empty when `_todo.yml` is absent or unreadable
 */
export async function readTodo(projectRoot: string, id: string): Promise<ITaskPlan> {
  let content: string;
  try {
    content = await readFile(taskPlanFile(projectRoot, id), 'utf8');
  } catch {
    return { groups: [], items: [] };
  }

  return parsePlan(content);
}

/**
 * Counts the items of a plan. Closed items — `done` and `cancelled` — make `done`, every item of
 * the flat list makes `total`; group entries carry no items of their own in schema v1.
 * @param items Items of the flat plan list
 * @returns Number of closed items and of items in total
 */
export function countPlanItems(items: readonly ITaskPlanItem[]): { done: number; total: number } {
  let done = 0;
  for (const item of items) {
    if (CLOSED_TASK_ITEM_STATUSES.some((status) => status === item.status)) done++;
  }

  return { done, total: items.length };
}

/**
 * Narrows a value to a status of the plan item schema.
 * @param value Value to check, typically a raw command argument
 * @returns `true` when the value is a status of schema v1
 */
export function isTaskItemStatus(value: unknown): value is UTaskItemStatus {
  return typeof value === 'string' && TASK_ITEM_STATUSES.some((status) => status === value);
}

function parsePlan(content: string): ITaskPlan {
  let document: Record<string, unknown> | undefined;
  try {
    document = toRecord(parseYaml(content));
  } catch {
    return { groups: [], items: [] };
  }

  if (document === undefined) return { groups: [], items: [] };

  return { groups: readGroups(document.groups), items: readItems(document.items) };
}

function readGroups(value: unknown): ITaskPlanGroup[] {
  const groups: ITaskPlanGroup[] = [];
  if (!Array.isArray(value)) return groups;

  for (const entry of value) {
    const group = toRecord(entry);
    if (group === undefined) continue;
    groups.push({ id: readText(group, 'id'), title: readText(group, 'title'), status: readText(group, 'status') });
  }

  return groups;
}

function readItems(value: unknown): ITaskPlanItem[] {
  const items: ITaskPlanItem[] = [];
  if (!Array.isArray(value)) return items;

  for (const entry of value) {
    const item = toRecord(entry);
    if (item === undefined) continue;
    items.push({
      id: readText(item, 'id'),
      group: readText(item, 'group'),
      text: readText(item, 'text'),
      status: readText(item, 'status'),
      executor: readText(item, 'executor'),
    });
  }

  return items;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}
