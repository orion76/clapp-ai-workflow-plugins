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
