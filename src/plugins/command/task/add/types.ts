import type { IKeyValueData, IKeyValuePair } from '@clapp/common';

/** Arguments of the `task add` command. */
export interface ITaskAddCommandConfig {
  /** Project name (workspace package name or "root"). Required. */
  project: string;
  /** Task name (kebab-case). Required. */
  name: string;
  /** Task description (optional). */
  description?: string;
}

/** Arguments of the `task add` command. */
export interface ITaskAddCommandContext {
  /** Project name (workspace package name or "root"). Required. */
  project: string;
  /** Task name (kebab-case). Required. */
}

/** Data of the `task add` command: the created task as key-value pairs. */
export interface ITaskAddData extends IKeyValueData {
  /** Heading above the pairs. */
  title: string;
  /** Name, project, path and activity of the created task. */
  pairs: IKeyValuePair[];
}
