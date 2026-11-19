import type { ITableData, TTableRow } from '@clapp/common';

/** Arguments of the `task list` command: the selection criteria, every one optional. */
export interface ITaskListCommandConfig {
  /** Activity of a task: `true` keeps the active one, `false` the rest. */
  active?: boolean;
  /** Status of a plan item; given with `group` or `executor` it switches the command to items. */
  status?: string;
  /** Group identifier of a plan item: the `groups[].id` of the schema. */
  group?: string;
  /** Executor of a plan item: `coder`, `tester`, `reviewer` or `planner`. */
  executor?: string;
}

/**
 * Data of the `task list` command: one table with the columns of the mode the criteria select.
 *
 * Both modes build every row as an array of cells in header order, so the table rows are narrowed
 * to arrays here and the schema `task-list` can require that shape.
 */
export interface ITaskListData extends ITableData {
  /** Column headers of the selected mode. */
  headers: string[];
  /** Rows of the selected mode: cells in the order of the headers. */
  rows: TTableRow[];
}
