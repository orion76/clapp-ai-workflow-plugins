/** Arguments of the `task todo` command. */
export interface ITaskTodoCommandConfig {
  /** Project name (workspace package name or "root"). Required. */
  project: string;
  /** Task name (task id). Required. */
  name: string;
}
