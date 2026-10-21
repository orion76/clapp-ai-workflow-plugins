import path from 'node:path';

import { injectable } from 'inversify';
import { NodePlugin } from '@orion76/node-plugin';

import { readTodo } from '@clapp/ai-workflow-plugins';
import {
  COMMAND_KIND_RESOURCE,
  type ICommandResult,
  type IFormatterCommandDefinitionData,
  type TFormatterData,
  PLUGIN_COMMAND_TYPE,
  PluginCommandBase,
} from '@clapp/command';

import type { ITaskTodoCommandConfig } from './types.js';

/**
 * Resource `task_todo`: shows the todo plan for a task.
 *
 * A read-only query, so it maps to the MCP Resources surface under the path `task/todo` and is
 * invoked as `task todo <project> <name>` by the CLI. The command returns its data instead of printing it:
 * the `table` formatter renders the `id`/`group`/`status`/`text` columns, and the core
 * prints that text — to stdout of the CLI, as the content of the MCP resource.
 */
@NodePlugin<IFormatterCommandDefinitionData<ITaskTodoCommandConfig>>({
  type: PLUGIN_COMMAND_TYPE,
  kind: COMMAND_KIND_RESOURCE,
  id: 'task_todo',
  command: 'todo',
  parent: 'task',
  label: 'Show task todo plan',
  formatter: 'table',
  config: {
    description: 'Show task todo plan',
    arguments: [
      { name: 'project', description: 'Project name (workspace package name or "root")', required: true },
      { name: 'name', description: 'Task name (task id)', required: true },
    ],
  },
})
@injectable()
export class TaskTodoCommandPlugin extends PluginCommandBase<ITaskTodoCommandConfig> {
  /**
   * Reads the todo plan and returns table data. An empty plan yields empty data, so the
   * formatter prints nothing instead of a placeholder line.
   * @param args Command arguments
   * @returns Table data with the id/group/status/text columns
   */
  async action(args: ITaskTodoCommandConfig): Promise<ICommandResult<TFormatterData<'table'>>> {
    const { project, name } = args;

    let todoData: any;
    try {
      todoData = await readTodo(project, name);
    } catch (e: any) {
      return {
        success: false,
        error: [`Unknown task "${name}" in project "${project}". Error: ${e.message}`],
      };
    }

    // Build table rows from the todo data
    const rows: string[][] = [];

    // Flatten all items from all groups
    const allItems: any[] = [];
    if (todoData.groups) {
      for (const group of todoData.groups) {
        if (group.items) {
          for (const item of group.items) {
            allItems.push(item);
          }
        }
      }
    }
    if (todoData.items) {
      for (const item of todoData.items) {
        allItems.push(item);
      }
    }

    for (const item of allItems) {
      rows.push([
        item.id,
        item.group || '',
        item.status || 'todo',
        item.text || '',
      ]);
    }

    return {
      success: true,
      data: {
        headers: ['id', 'group', 'status', 'text'],
        rows,
      },
    };
  }
}