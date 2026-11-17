/** Profile a task declares in `**Профиль:**`: how much work the task includes. */
export type UTaskProfile = 'full' | 'normal' | 'small';

/**
 * Status of a plan item (schema v1). `done` and `cancelled` close an item, the rest keep it
 * open; the closed ones are listed in `CLOSED_TASK_ITEM_STATUSES`.
 */
export type UTaskItemStatus = 'todo' | 'in-progress' | 'done' | 'question' | 'deferred' | 'blocked' | 'cancelled';

/** Header of a task: what the H1 and the profile line of its `_task.md` declare. */
export interface ITaskHeader {
  /** Task id — the name of the task directory. */
  id: string;
  /** Title of the H1 without the `<task-id>: ` prefix; the id when the heading names no title. */
  title: string;
  /** Declared profile; absent when `_task.md` names none. */
  profile?: UTaskProfile;
}

/** Group of a plan (schema v1): the `groups` entries the items refer to by `id`. */
export interface ITaskPlanGroup {
  id: string;
  title: string;
  status: string;
}

/**
 * Item of a plan (schema v1): an entry of the flat `items` list. The status stays the text the
 * file carries, so a value outside the schema is visible instead of being dropped.
 */
export interface ITaskPlanItem {
  id: string;
  group: string;
  text: string;
  status: string;
  executor: string;
}

/** Plan of a task: the `groups` list and the flat `items` list of its `_todo.yml`. */
export interface ITaskPlan {
  groups: ITaskPlanGroup[];
  items: ITaskPlanItem[];
}

/** A task as a list of tasks shows it: its header, the metrics of its plan and its activity. */
export interface ITaskMeta {
  id: string;
  title: string;
  profile?: UTaskProfile;
  /** Items closed with `done` or `cancelled`. */
  done: number;
  /** Items of the flat plan list; groups are not counted. */
  total: number;
  /** Whether the project's `.opencode/_task.md` points at this task. */
  active: boolean;
}

/** A plan item together with the task whose plan carries it. */
export interface ITaskItemRow extends ITaskPlanItem {
  /** Id of the task the item belongs to. */
  task: string;
}

/** Criteria a selection of tasks or plan items is narrowed by; every one is optional. */
export interface ITaskSelectionCriteria {
  /** Activity of a task: whether to keep the active one or the rest. */
  active?: boolean;
  status?: UTaskItemStatus;
  group?: string;
  executor?: string;
}

/** Result of creating a task: the paths it owns and the activation of its links. */
export interface ICreateTaskResult {
  success: boolean;
  /** Path of the task directory. */
  taskPath: string;
  /** Path of its `_task.md`. */
  taskMdPath: string;
  /** Path of its `_todo.yml`. */
  todoYmlPath: string;
  /** Whether the task links of the project point at the new task. */
  activated: boolean;
  error?: string;
}
