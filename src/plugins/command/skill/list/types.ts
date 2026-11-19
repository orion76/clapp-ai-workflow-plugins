import type { ITableData, TTableRecordRow } from '@clapp/common';

/** Arguments of the `skill/list` command. */
export interface ISkillListCommandConfig {
  /** Target project directory; the process working directory by default. */
  dir?: string;
  /** Storage scope: `project` or `global`; both scopes are listed when omitted. */
  scope?: string;
}

/**
 * Data of the `skill/list` command: the skills as one table keyed by its headers.
 *
 * Unlike the row arrays of `task list`, a skill row is an object, so the schema `skill-list`
 * describes the `name`/`scope`/`description` properties instead of cell positions.
 */
export interface ISkillListData extends ITableData {
  /** Column headers: `name`, `scope` and `description`. */
  headers: string[];
  /** Rows keyed by the headers. */
  rows: TTableRecordRow[];
}
