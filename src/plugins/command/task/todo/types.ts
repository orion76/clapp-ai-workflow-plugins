import type { ITableData, TTableRow } from '@clapp/common';

/** Arguments of the `task todo` command. */
export interface ITaskTodoCommandConfig {
  /** Project name (workspace package name or "root"). Required. */
  project: string;
  /** Task name (task id). Required. */
  name: string;
}

/**
 * Data of the `task todo` command: the plan items of a task as one table.
 *
 * A plan item has no dedicated type here — the reader returns the parsed document — so the rows
 * carry already flattened cells and the schema `task-todo` describes their columns.
 */
export interface ITaskTodoData extends ITableData {
  /** Column headers: `id`, `group`, `status` and `text`. */
  headers: string[];
  /** Rows of the plan items: cells in the order of the headers. */
  rows: TTableRow[];
}
