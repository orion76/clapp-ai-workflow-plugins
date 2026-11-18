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
