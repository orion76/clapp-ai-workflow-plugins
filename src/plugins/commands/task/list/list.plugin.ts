import { NodePlugin } from '@orion76/node-plugin';
import { inject, injectable } from 'inversify';

import {
  isTaskItemStatus,
  listTaskItems,
  listTasks,
  TASK_ITEM_STATUSES,
  type ITaskSelectionCriteria,
  type UTaskItemStatus,
} from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_RESOURCE,
  CURRENT_PROJECT_PATH,
  IPluginCommandDefinitionData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
  type ICommandResult,
  type TContextAccessor,
  type TFormatterData,
} from '@clapp/common';

import type { ITaskListCommandConfig } from './types.js';

/**
 * Resource `task/list`: the tasks of the current project, or their plan items.
 *
 * The root of the project comes from the `current-project-path` context, never from an argument.
 * Without a `status`/`group`/`executor` criterion the command lists tasks (id | title | done |
 * total | active); with one of them it lists the plan items of every task (task | id | group |
 * status | executor | text).
 */
@NodePlugin<IPluginCommandDefinitionData<ITaskListCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'task_list',
  command: 'list',
  parent: 'task',
  label: 'List tasks',
  formatter: 'table',
  config: {
    description:
      'List the tasks of the current project, or the plan items of all its tasks when status/group/executor is given',
    options: [
      {
        name: 'active',
        description: 'Keep the active task only: --active in the CLI, true or false in the URI',
        type: 'boolean',
      },
      {
        name: 'status',
        description: 'Plan item status: todo, in-progress, done, question, deferred, blocked or cancelled',
        type: 'string',
        required: true,
        choices: [...TASK_ITEM_STATUSES],
      },
      {
        name: 'group',
        description: 'Plan item group id, the groups[].id of the plan',
        type: 'string',
        required: true,
      },
      {
        name: 'executor',
        description: 'Plan item executor: coder, tester, reviewer or planner',
        type: 'string',
        required: true,
      },
    ],
  },
})
@injectable()
export class TaskListCommandPlugin extends PluginCommandBase<ITaskListCommandConfig> {
  @inject(CURRENT_PROJECT_PATH) private readonly currentProjectPath!: TContextAccessor<string>;

  /**
   * Collects the selection as table data. An empty selection yields empty data, so the formatter
   * prints nothing instead of a placeholder line.
   * @param args Selection criteria of the command
   * @returns Table data of the task mode or of the item mode, or a failed result naming the reason
   */
  async action(args: ITaskListCommandConfig): Promise<ICommandResult<TFormatterData<'table'>>> {
    const { active, status, group, executor } = args;

    let itemStatus: UTaskItemStatus | undefined;
    if (status !== undefined) {
      if (!isTaskItemStatus(status)) {
        return {
          success: false,
          error: [`Unknown status "${status}". Allowed statuses: ${TASK_ITEM_STATUSES.join(' | ')}`],
        };
      }

      itemStatus = status;
    }

    let projectRoot: string;
    try {
      projectRoot = await this.currentProjectPath();
    } catch (error) {
      return { success: false, error: [error instanceof Error ? error.message : String(error)] };
    }

    if (itemStatus !== undefined || group !== undefined || executor !== undefined) {
      const criteria: ITaskSelectionCriteria = { active, status: itemStatus, group, executor };
      const items = await listTaskItems(projectRoot, criteria);

      return {
        success: true,
        data: {
          headers: ['task', 'id', 'group', 'status', 'executor', 'text'],
          rows: items.map((item) => [item.task, item.id, item.group, item.status, item.executor, item.text]),
        },
      };
    }

    const tasks = await listTasks(projectRoot);
    const selected = active === undefined ? tasks : tasks.filter((task) => task.active === active);

    return {
      success: true,
      data: {
        headers: ['id', 'title', 'done', 'total', 'active'],
        rows: selected.map((task) => [task.id, task.title, task.done, task.total, task.active ? 'yes' : 'no']),
      },
    };
  }
}
